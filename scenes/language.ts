import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import customKFunction from '#keyboard/custom'
import HLanguage from '#helper/language'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'

const scene = new Scene<BotContext>('Language')

scene.step(async (ctx) => {
  const buttons = inlineKFunction(
    Infinity,
    { view: '🇺🇿', text: 'uz' },
    { view: '🇷🇺', text: 'ru' },
    { view: '🇺🇸', text: 'en' },
  )
  const message = HLanguage(ctx.user.language, 'chooseLanguage')

  ctx.session.message = message
  ctx.session.buttons = buttons

  await ctx.reply(message, { reply_markup: buttons })
})

scene.wait('language').on('callback_query:data', async (ctx) => {
  const language = ctx.update.callback_query.data

  if (!['uz', 'ru', 'en'].includes(language)) {
    return ctx.editMessageText(ctx.session.message, { reply_markup: ctx.session.buttons })
  }

  await ctx.answerCallbackQuery()

  const userId = ctx.update.callback_query.from.id
  const message = HLanguage(language, 'changedLanguage')

  await Model.User.updateOne<IUser>({ userId }, { language })
  ctx.user.language = language

  const keyboardText = HLanguage(language, 'mainKeyboard')
  const buttons = customKFunction(2, ...keyboardText)

  await ctx.deleteMessage()
  await ctx.reply(message, { reply_markup: { keyboard: buttons.build(), resize_keyboard: true } })
  ctx.scene.exit()
})

export default scene
