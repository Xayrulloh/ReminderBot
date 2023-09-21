import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import HLanguage from '#helper/language'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'

const scene = new Scene<BotContext>('Fasting')

scene.do(async (ctx) => {
  const message = HLanguage(ctx.user.language, 'fastingMessage')
  const keyboardMessage = HLanguage(ctx.user.language, 'agreementFasting')
  const buttons = inlineKFunction(
    Infinity,
    { view: keyboardMessage[0], text: keyboardMessage[0] },
    { view: keyboardMessage[1], text: keyboardMessage[1] },
  )

  ctx.session.keyboardMessage = keyboardMessage
  ctx.session.message = message
  ctx.session.buttons = buttons

  await ctx.reply(message, { reply_markup: buttons })
})

scene.wait().on('callback_query:data', async (ctx) => {
  if (ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    await ctx.answerCallbackQuery()

    const fasting = ctx.session.keyboardMessage[0] === ctx.update.callback_query.data

    await Model.User.updateOne<IUser>({ userId: ctx.user.userId }, { fasting })

    const message = HLanguage(ctx.user.language, 'notifChange')

    await ctx.editMessageText(message)
    ctx.scene.exit()
  } else {
    await ctx.answerCallbackQuery(HLanguage(ctx.user.language, 'wrongSelection'))
  }
})

export default scene
