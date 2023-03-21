import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '../keyboard/inline.js'
import customKFunction from '../keyboard/custom.js'
import HLanguage from '#helper/language'

const scene = new Scene('Start')

// language
scene.do(async (ctx) => {
  const userId = ctx.update.message.from.id
  const userName = ctx.update.message.from.username
  const name = ctx.update.message.from.first_name

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
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
    return
  }

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
  ctx.session.keyboardMessage = keyboardMessage

  ctx.reply(message, { reply_markup: buttons })
  ctx.scene.resume()
})

// notification
scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.regionId.includes(+ctx.update.callback_query.data)) {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
    return
  }

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

  ctx.reply(message, { reply_markup: buttons })
  ctx.scene.resume()
})

// fasting
scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
    return
  }

  const message = HLanguage(ctx.session.language, 'fastingMessage')
  const keyboardMessage = HLanguage(ctx.session.language, 'agreementFasting')
  const buttons = inlineKFunction(
    Infinity,
    { view: keyboardMessage[0], text: keyboardMessage[0] },
    { view: keyboardMessage[1], text: keyboardMessage[1] },
  )

  ctx.session.notification = ctx.session.keyboardMessage[0] == ctx.update.callback_query.data ? true : false
  ctx.session.keyboardMessage = keyboardMessage
  ctx.session.message = message
  ctx.session.buttons = buttons

  ctx.reply(message, { reply_markup: buttons })
  ctx.scene.resume()
})

// the end
scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
    return
  }

  const fasting = ctx.session.keyboardMessage[0] == ctx.update.callback_query.data ? true : false

  const now = new Date()
  const today = now.getDay() + 1
  const message = HLanguage(ctx.session.language, 'infoPrayTime')
  const data = await Model.PrayTime.findOne({ day: today, regionId: ctx.session.regionId })

  await Model.User.create({
    userId: ctx.session.userId,
    userName: ctx.session.userName,
    name: ctx.session.name,
    notification: ctx.session.notification,
    fasting,
    region: data.region,
    regionId: data.regionId,
    donate: 0,
    language: ctx.session.language,
  })

  let response = message.replace('$region', data.region)
  response = response.replace('$fajr', data.fajr)
  response = response.replace('$sunrise', data.sunrise)
  response = response.replace('$zuhr', data.zuhr)
  response = response.replace('$asr', data.asr)
  response = response.replace('$maghrib', data.maghrib)
  response = response.replace('$isha', data.isha)

  ctx.reply(response)
  ctx.scene.exit()
})

export default scene
