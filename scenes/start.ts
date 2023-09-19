import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import customKFunction from '#keyboard/custom'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import fs from 'fs'
import path from 'path'
import { BotContext } from '#types/context'

const scene = new Scene<BotContext>('Start')

// language
scene.do(async (ctx) => {
  const userId = ctx.update.message?.from?.id || ctx.update.callback_query?.from?.id
  const userName = ctx.update.message?.from?.username || ctx.update.callback_query?.from?.username
  const name = ctx.update.message?.from?.first_name || ctx.update.callback_query?.from?.first_name

  const buttons = inlineKFunction(
    Infinity,
    { view: '🇺🇿', text: 'uz' },
    { view: '🇷🇺', text: 'ru' },
    { view: '🇺🇸', text: 'en' },
  )
  const message = HLanguage('en', 'chooseLanguage')

  ctx.session.userId = userId
  ctx.session.userName = userName
  ctx.session.name = name
  ctx.session.buttons = buttons
  ctx.session.message = message

  ctx.reply(message, { reply_markup: buttons })
})

// region
scene.wait().on('callback_query:data', async (ctx) => {
  const language = ctx.update.callback_query.data
  ctx.session.language = language

  if (!['uz', 'ru', 'en'].includes(language)) {
    return ctx.answerCallbackQuery(HLanguage('uz', 'wrongSelection'))
  }

  ctx.answerCallbackQuery()

  const message = HLanguage(language, 'chooseRegion')
  const keyboardMessage = HLanguage(language, 'region')
  const keyboard = []

  for (let region in keyboardMessage) {
    keyboard.push({ view: region, text: keyboardMessage[region] })
  }

  const buttons = inlineKFunction(3, ...keyboard)

  ctx.session.regionId = Object.values(keyboardMessage)
  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.regions = keyboardMessage

  ctx.editMessageText(message, { reply_markup: buttons })
  ctx.scene.resume()
})

// notification
scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.regionId.includes(+ctx.update.callback_query.data)) {
    return ctx.answerCallbackQuery(HLanguage(ctx.session.language, 'wrongSelection'))
  }

  ctx.answerCallbackQuery()

  ctx.session.regionId = +ctx.update.callback_query.data

  const message = HLanguage(ctx.session.language, 'notificationMessage')
  const keyboardMessage = HLanguage(ctx.session.language, 'agreementNotification')
  const buttons = inlineKFunction(
    Infinity,
    { view: keyboardMessage[0], text: keyboardMessage[0] },
    { view: keyboardMessage[1], text: keyboardMessage[1] },
  )

  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.keyboardMessage = keyboardMessage

  ctx.editMessageText(message, { reply_markup: buttons })
  ctx.scene.resume()
})

// fasting
scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    return ctx.answerCallbackQuery(HLanguage(ctx.session.language, 'wrongSelection'))
  }

  ctx.answerCallbackQuery()

  const message = HLanguage(ctx.session.language, 'fastingMessage')
  const keyboardMessage = HLanguage(ctx.session.language, 'agreementFasting')
  const buttons = inlineKFunction(
    Infinity,
    { view: keyboardMessage[0], text: keyboardMessage[0] },
    { view: keyboardMessage[1], text: keyboardMessage[1] },
  )

  ctx.session.notification = ctx.session.keyboardMessage[0] === ctx.update.callback_query.data
  ctx.session.keyboardMessage = keyboardMessage
  ctx.session.message = message
  ctx.session.buttons = buttons

  ctx.editMessageText(message, { reply_markup: buttons })
  ctx.scene.resume()
})

// the end
scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    return ctx.answerCallbackQuery(HLanguage(ctx.session.language, 'wrongSelection'))
  }

  ctx.answerCallbackQuery()

  const fasting = ctx.session.keyboardMessage[0] === ctx.update.callback_query.data

  const now = new Date()
  const today = now.getDate()
  const message = HLanguage(ctx.session.language, 'infoPrayTime')
  const data = await Model.PrayTime.findOne({ day: today, regionId: ctx.session.regionId })
  let regionName = ''

  for (const key in ctx.session.regions) {
    if (ctx.session.regions[key] === data.regionId) {
      regionName = key
      break
    }
  }

  await Model.User.create({
    userId: ctx.session.userId,
    userName: ctx.session.userName || 'unknown',
    name: ctx.session.name || 'name',
    notification: ctx.session.notification,
    fasting,
    region: regionName,
    regionId: data.regionId,
    donate: 0,
    language: ctx.session.language,
  })

  let response = HReplace(
    message,
    ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
    [data.region, data.fajr, data.sunrise, data.dhuhr, data.asr, data.maghrib, data.isha],
  )
  const dailyHadith = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'translate', 'localStorage.json'), {
      encoding: 'utf-8',
    }),
  )?.dailyHadith

  const keyboardText = HLanguage(ctx.session.language, 'mainKeyboard')
  const buttons = customKFunction(2, ...keyboardText)

  ctx.deleteMessage()
  ctx.reply(response + dailyHadith, {
    reply_markup: {
      keyboard: buttons.build(),
      resize_keyboard: true,
    },
  })
  ctx.scene.exit()
})

export default scene
