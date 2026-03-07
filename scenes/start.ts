import { Scene } from 'grammy-scenes'
import dayjs from '#utils/dayjs'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import customKFunction from '#keyboard/custom'
import { t } from '#config/i18n'
import { regions } from '#config/regions'
import { BotContext } from '#types/context'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IUser } from '#types/database'
import { getPrayerTimes } from '#utils/prayerTimes'

const scene = new Scene<BotContext>('Start')

// region
scene.step(async (ctx) => {
  const message = t($ => $.chooseRegion)
  const keyboard = []

  for (let region in regions) {
    keyboard.push({ view: region, text: String(regions[region]) })
  }

  const buttons = inlineKFunction(3, keyboard)

  ctx.session.regionId = Object.values(regions)
  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.regions = regions
  ctx.session.currPage = 1
  ctx.session.keyboard = keyboard

  await ctx.reply(message, { reply_markup: buttons })
})

// fasting
scene.wait('fasting').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update.callback_query.data

  if (!ctx.session.regionId.includes(+inputData) && !['<', '>'].includes(inputData)) {
    await ctx.answerCallbackQuery(t($ => $.wrongSelection))
  }

  if (['<', '>', 'pageNumber'].includes(inputData)) {
    if (inputData == '<' && ctx.session.currPage != 1) {
      await ctx.answerCallbackQuery()

      ctx.session.buttons = inlineKFunction(3, ctx.session.keyboard, --ctx.session.currPage)

      await ctx.editMessageText(ctx.session.message, { reply_markup: ctx.session.buttons, parse_mode: 'HTML' })
    } else if (inputData == '>' && ctx.session.currPage * 12 <= ctx.session.regionId.length) {
      await ctx.answerCallbackQuery()

      ctx.session.buttons = inlineKFunction(3, ctx.session.keyboard, ++ctx.session.currPage)

      await ctx.editMessageText(ctx.session.message, { reply_markup: ctx.session.buttons, parse_mode: 'HTML' })
    } else {
      await ctx.answerCallbackQuery(t($ => $.wrongSelection))
    }
  } else {
    await ctx.answerCallbackQuery()

    ctx.session.regionId = +ctx.update.callback_query.data

    const message = t($ => $.fastingMessage)
    const keyboardMessage = t($ => $.agreementFasting, { returnObjects: true })
    const buttons = inlineKFunction(Infinity, [
      { view: keyboardMessage[0], text: keyboardMessage[0] },
      { view: keyboardMessage[1], text: keyboardMessage[1] },
    ])

    ctx.session.keyboardMessage = keyboardMessage
    ctx.session.message = message
    ctx.session.buttons = buttons

    await ctx.editMessageText(message, { reply_markup: buttons })
    ctx.scene.resume()
  }
})

// the end
scene.wait('the_end').on('callback_query:data', async (ctx) => {
  if (!ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    return ctx.answerCallbackQuery(t($ => $.wrongSelection))
  }

  await ctx.answerCallbackQuery()

  const fasting = ctx.session.keyboardMessage[0] === ctx.update.callback_query.data

  const now = dayjs()
  const data = getPrayerTimes(ctx.session.regionId, now.toDate())
  let regionName = ''

  if (!data) return ctx.scene.exit()

  for (const key in ctx.session.regions) {
    if (ctx.session.regions[key] === data.regionId) {
      regionName = key
      break
    }
  }

  await Model.User.create<IUser>({
    userId: ctx.from.id,
    userName: ctx.from.username || 'unknown',
    name: ctx.from.first_name || 'name',
    fasting,
    region: regionName,
    regionId: data.regionId,
    donate: 0,
    status: true,
  })

  const response = t($ => $.infoPrayTime, {
    region: data.region,
    fajr: data.fajr,
    sunrise: data.sunrise,
    zuhr: data.dhuhr,
    asr: data.asr,
    maghrib: data.maghrib,
    isha: data.isha,
    date: now.format('DD/MM/YYYY'),
  })
  const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String()

  const keyboardText = t($ => $.mainKeyboard, { returnObjects: true })
  const buttons = customKFunction(2, ...keyboardText)

  await ctx.deleteMessage()
  await ctx.reply(response + dailyHadith, {
    reply_markup: {
      keyboard: buttons.build(),
      resize_keyboard: true,
    },
    parse_mode: 'HTML',
  })

  ctx.scene.exit()
})

export default scene
