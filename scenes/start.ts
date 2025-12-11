import { Scene } from 'grammy-scenes'
import dayjs from '#utils/dayjs'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import customKFunction from '#keyboard/custom'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import { BotContext } from '#types/context'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IPrayTime, IUser } from '#types/database'

const scene = new Scene<BotContext>('Start')

// region
scene.step(async (ctx) => {
  const message = HLanguage('chooseRegion')
  const keyboardMessage = HLanguage('region')
  const keyboard = []

  for (let region in keyboardMessage) {
    keyboard.push({ view: region, text: keyboardMessage[region] })
  }

  const buttons = inlineKFunction(3, keyboard)

  ctx.session.regionId = Object.values(keyboardMessage)
  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.regions = keyboardMessage
  ctx.session.currPage = 1
  ctx.session.keyboard = keyboard

  await ctx.reply(message, { reply_markup: buttons })
})

// fasting
scene.wait('fasting').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update.callback_query.data

  if (!ctx.session.regionId.includes(+inputData) && !['<', '>'].includes(inputData)) {
    await ctx.answerCallbackQuery(HLanguage('wrongSelection'))
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
      await ctx.answerCallbackQuery(HLanguage('wrongSelection'))
    }
  } else {
    await ctx.answerCallbackQuery()

    ctx.session.regionId = +ctx.update.callback_query.data

    const message = HLanguage('fastingMessage')
    const keyboardMessage = HLanguage('agreementFasting')
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
    return ctx.answerCallbackQuery(HLanguage('wrongSelection'))
  }

  await ctx.answerCallbackQuery()

  const fasting = ctx.session.keyboardMessage[0] === ctx.update.callback_query.data

  const now = dayjs()
  const currentMonth = now.get('month') + 1
  const message = HLanguage('infoPrayTime')
  const today = now.get('date')
  const data = await Model.PrayTime.findOne<IPrayTime>({
    day: today,
    regionId: ctx.session.regionId,
    month: currentMonth,
  })
  let regionName = ''

  if (!data) return ctx.scene.exit()

  for (const key in ctx.session.regions) {
    if (ctx.session.regions[key] === data?.regionId) {
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

  let response = HReplace(
    message,
    ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha', '$date'],
    [data.region, data.fajr, data.sunrise, data.dhuhr, data.asr, data.maghrib, data.isha, now.format('DD/MM/YYYY')],
  )
  const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String()

  const keyboardText = HLanguage('mainKeyboard')
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
