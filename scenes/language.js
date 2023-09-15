import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '../keyboard/inline.js'
import customKFunction from '../keyboard/custom.js'
import HLanguage from '#helper/language'

const scene = new Scene('Language')

scene.do(async (ctx) => {
  const buttons = inlineKFunction(
    Infinity,
    { view: '🇺🇿', text: 'uz' },
    { view: '🇷🇺', text: 'ru' },
    { view: '🇺🇸', text: 'en' },
  )
  const message = HLanguage(ctx.user.language, 'chooseLanguage')

  ctx.session.message = message
  ctx.session.buttons = buttons

  ctx.reply(message, { reply_markup: buttons })
})

scene.wait().on('callback_query:data', async (ctx) => {
  const language = ctx.update.callback_query.data

  if (!['uz', 'ru', 'en'].includes(language)) {
    return ctx.editMessageText(message, { reply_markup: buttons })
  }

  ctx.answerCallbackQuery()

  const userId = ctx.update.callback_query.from.id
  const message = HLanguage(language, 'changedLanguage')

  await Model.User.updateOne({ userId }, { language })
  ctx.user.language = language

  const keyboardText = HLanguage(language, 'mainKeyboard')
  const buttons = customKFunction(2, ...keyboardText)

  ctx.deleteMessage()
  ctx.reply(message, { reply_markup: { keyboard: buttons.build(), resize_keyboard: true } })
  ctx.scene.exit()
})

export default scene
