import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '../keyboard/inline.js'
import HLanguage from '#helper/language'
import { InlineKeyboard } from 'grammy'
import { HReplace } from '#helper/replacer'

const scene = new Scene('Notification')

scene.do(async (ctx) => {
  const message = HLanguage(ctx.user.language, 'notificationMessage')
  const keyboardMessage = HLanguage(ctx.user.language, 'agreementNotification')
  const buttons = inlineKFunction(
    Infinity,
    { view: keyboardMessage[0], text: keyboardMessage[0] },
    { view: keyboardMessage[1], text: keyboardMessage[1] },
  )

  ctx.session.keyboardMessage = keyboardMessage

  ctx.reply(message, { reply_markup: buttons })
})

scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    return ctx.answerCallbackQuery(HLanguage(ctx.user.language, 'wrongSelection'))
  }
  await ctx.answerCallbackQuery()
  const successMessage = HLanguage(ctx.user.language, 'notifChange')
  const notification = ctx.session.keyboardMessage[0] === ctx.update.callback_query.data

  if (!notification) {
    await Model.User.updateOne({ userId: ctx.user.userId }, { notification })
    ctx.editMessageText(successMessage)
    return ctx.scene.exit()
  }

  const message = HLanguage(ctx.user.language, 'setPrayerTimes')
  const setPrayerTimesMessage = HLanguage(ctx.user.language, 'setPrayerTimesKeyboard')

  ctx.session.notificationSetting = ctx.user.notificationSetting
  ctx.session.setPrayerTimesMessage = setPrayerTimesMessage
  ctx.session.successMessage = successMessage
  ctx.session.message = message
  ctx.session.prayerTimes = Object.keys(setPrayerTimesMessage)

  const settingKeyboard = buildSettingKeyboard(ctx)

  ctx.editMessageText(message, { reply_markup: settingKeyboard })
  ctx.scene.resume()
})

scene.wait().on('callback_query:data', async (ctx) => {
  if (!ctx.session.setPrayerTimesMessage[ctx.callbackQuery.data]) {
    return ctx.answerCallbackQuery(HLanguage(ctx.user.language, 'wrongSelection'))
  }

  await ctx.answerCallbackQuery()

  if (ctx.callbackQuery.data !== 'save') {
    ctx.session.notificationSetting[ctx.callbackQuery.data] = !ctx.session.notificationSetting[ctx.callbackQuery.data]
    const settingKeyboard = buildSettingKeyboard(ctx)
    return ctx.editMessageText(ctx.session.message, { reply_markup: settingKeyboard })
  }

  await Model.User.updateOne({ userId: ctx.user.userId }, { 
    notification: true,
    notificationSetting: ctx.session.notificationSetting
  })
  ctx.editMessageText(ctx.session.successMessage)
  return ctx.scene.exit()
})

function buildSettingKeyboard(ctx) {
  const keyboard = new InlineKeyboard()

  for (const index in ctx.session.prayerTimes) {
    const key = ctx.session.prayerTimes[index]
    let text = ctx.session.setPrayerTimesMessage[key]

    if (key !== 'save') {
      text = HReplace(
        ctx.session.setPrayerTimesMessage[key],
        ['$state'],
        [ctx.session.notificationSetting[key] ? '✅' : '❌'],
      )
    }

    keyboard.text(text, key)

    if (index % 2) {
      keyboard.row()
    }
  }

  return keyboard
}

export default scene
