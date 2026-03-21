import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { t } from '#config/i18n'
import regionsData from '#config/regions.json'
import { memoryStorage } from '#config/storage'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import type { BotContext } from '#types/context'
import type { IUser } from '#types/database'
import { DAILY_QURAN_KEY } from '#utils/constants'
import dayjs from '#utils/dayjs'
import { getPrayerTimes, getRegionIds } from '#utils/prayerTimes'

const regionsById = getRegionIds()
const REGION_KEYBOARD = regionsData.map((r) => ({
  view: r.name,
  text: String(r.id),
}))

const scene = new Scene<BotContext>('Start')

// region
scene.step(async (ctx) => {
  const buttons = inlineKFunction(3, REGION_KEYBOARD)

  ctx.session.currPage = 1

  await ctx.reply(
    t(($) => $.chooseRegion),
    { reply_markup: buttons },
  )
})

// fasting
scene.wait('fasting').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update.callback_query.data

  if (!regionsById.has(+inputData) && !['<', '>', 'pageNumber'].includes(inputData)) {
    return await ctx.answerCallbackQuery(t(($) => $.wrongSelection))
  }

  if (['<', '>', 'pageNumber'].includes(inputData)) {
    if (inputData === '<' && ctx.session.currPage !== 1) {
      await ctx.answerCallbackQuery()

      const buttons = inlineKFunction(3, REGION_KEYBOARD, --ctx.session.currPage)

      await ctx.editMessageText(
        t(($) => $.chooseRegion),
        {
          reply_markup: buttons,
          parse_mode: 'HTML',
        },
      )
    } else if (inputData === '>' && ctx.session.currPage * 12 < regionsById.size) {
      await ctx.answerCallbackQuery()

      const buttons = inlineKFunction(3, REGION_KEYBOARD, ++ctx.session.currPage)

      await ctx.editMessageText(
        t(($) => $.chooseRegion),
        {
          reply_markup: buttons,
          parse_mode: 'HTML',
        },
      )
    } else {
      await ctx.answerCallbackQuery(t(($) => $.wrongSelection))
    }
  } else {
    await ctx.answerCallbackQuery()

    ctx.session.selectedRegionId = +ctx.update.callback_query.data

    const keyboardMessage = t(($) => $.agreementFasting, {
      returnObjects: true,
    })
    const buttons = inlineKFunction(Infinity, [
      { view: keyboardMessage[0], text: keyboardMessage[0] },
      { view: keyboardMessage[1], text: keyboardMessage[1] },
    ])

    await ctx.editMessageText(
      t(($) => $.fastingMessage),
      {
        reply_markup: buttons,
      },
    )
    ctx.scene.resume()
  }
})

// the end
scene.wait('the_end').on('callback_query:data', async (ctx) => {
  const keyboardMessage = t(($) => $.agreementFasting, {
    returnObjects: true,
  })

  if (!(keyboardMessage as string[]).includes(ctx.update.callback_query.data)) {
    return ctx.answerCallbackQuery(t(($) => $.wrongSelection))
  }

  await ctx.answerCallbackQuery()

  const fasting = keyboardMessage[0] === ctx.update.callback_query.data

  const now = dayjs()
  const data = getPrayerTimes(ctx.session.selectedRegionId, now)
  if (!data) return ctx.scene.exit()

  const regionName = regionsData.find((r) => r.id === data.regionId)?.name ?? ''

  await Model.User.create({
    userId: ctx.from.id,
    userName: ctx.from.username || 'unknown',
    name: ctx.from.first_name || 'name',
    fasting,
    region: regionName,
    regionId: data.regionId,
    donate: 0,
    status: true,
  })

  const response = t(($) => $.infoPrayTime, {
    region: data.region,
    fajr: data.fajr,
    sunrise: data.sunrise,
    dhuhr: data.dhuhr,
    asr: data.asr,
    maghrib: data.maghrib,
    isha: data.isha,
    date: now.format('DD/MM/YYYY'),
  })
  const dailyQuran = memoryStorage.read(DAILY_QURAN_KEY) ?? String()

  const keyboardText = t(($) => $.mainKeyboard, { returnObjects: true })
  const buttons = customKFunction(2, ...keyboardText)

  await ctx.deleteMessage()
  await ctx.reply(response + dailyQuran, {
    reply_markup: {
      keyboard: buttons.build(),
      resize_keyboard: true,
    },
    parse_mode: 'HTML',
  })

  ctx.scene.exit()
})

export default scene
