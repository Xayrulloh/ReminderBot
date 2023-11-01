import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import HLanguage from '#helper/language'
import { InlineKeyboard } from 'grammy'
import { HReplace } from '#helper/replacer'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'

const scene = new Scene<BotContext>('Notification')

scene.step(async (ctx) => {
  const message = HLanguage('notificationMessage')
  const keyboardMessage = HLanguage('agreementNotification')
  const buttons = inlineKFunction(
    Infinity,
    { view: keyboardMessage[0], text: keyboardMessage[0] },
    { view: keyboardMessage[1], text: keyboardMessage[1] },
  )

  ctx.session.keyboardMessage = keyboardMessage

  await ctx.reply(message, { reply_markup: buttons })
})

scene.wait('notification').on('callback_query:data', async (ctx) => {
  if (!ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    return ctx.answerCallbackQuery(HLanguage('wrongSelection'))
  }
  await ctx.answerCallbackQuery()
  const successMessage = HLanguage('notifChange')
  const notification = ctx.session.keyboardMessage[0] === ctx.update.callback_query.data

  if (!notification) {
    await Model.User.updateOne<IUser>({ userId: ctx.user.userId }, { notification })
    await ctx.editMessageText(successMessage)
    return ctx.scene.exit()
  }

  const message = HLanguage('setPrayerTimes')
  const setPrayerTimesMessage = HLanguage('setPrayerTimesKeyboard')

  ctx.session.notificationSetting = ctx.user.notificationSetting
  ctx.session.setPrayerTimesMessage = setPrayerTimesMessage
  ctx.session.successMessage = successMessage
  ctx.session.message = message
  ctx.session.prayerTimes = Object.keys(setPrayerTimesMessage)

  const settingKeyboard = buildSettingKeyboard(ctx)

  await ctx.editMessageText(message, { reply_markup: settingKeyboard })
  ctx.scene.resume()
})

scene.wait('notification_settings').on('callback_query:data', async (ctx) => {
  if (!ctx.session.setPrayerTimesMessage[ctx.callbackQuery.data]) {
    return ctx.answerCallbackQuery(HLanguage('wrongSelection'))
  }

  await ctx.answerCallbackQuery()

  if (ctx.callbackQuery.data !== 'save') {
    ctx.session.notificationSetting[ctx.callbackQuery.data] = !ctx.session.notificationSetting[ctx.callbackQuery.data]
    const settingKeyboard = buildSettingKeyboard(ctx)
    return ctx.editMessageText(ctx.session.message, { reply_markup: settingKeyboard })
  }

  await Model.User.updateOne<IUser>(
    { userId: ctx.user.userId },
    {
      notification: true,
      notificationSetting: ctx.session.notificationSetting,
    },
  )
  await ctx.editMessageText(ctx.session.successMessage)
  return ctx.scene.exit()
})

function buildSettingKeyboard(ctx: BotContext) {
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

    if (parseInt(index) % 2) {
      keyboard.row()
    }
  }

  return keyboard
}

export default scene
