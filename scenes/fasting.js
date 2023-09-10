import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '../keyboard/inline.js'
import HLanguage from '#helper/language'

const scene = new Scene('Fasting')

scene.do(async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })
  const message = HLanguage(user.language, 'fastingMessage')
  const keyboardMessage = HLanguage(user.language, 'agreementFasting')
  const buttons = inlineKFunction(
    Infinity,
    { view: keyboardMessage[0], text: keyboardMessage[0] },
    { view: keyboardMessage[1], text: keyboardMessage[1] },
  )

  ctx.session.keyboardMessage = keyboardMessage
  ctx.session.userId = userId
  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.language = user.language

  ctx.reply(message, { reply_markup: buttons })
})

scene.wait().on('callback_query:data', async (ctx) => {
  if (ctx.session.keyboardMessage.includes(ctx.update.callback_query.data)) {
    const fasting = ctx.session.keyboardMessage[0] == ctx.update.callback_query.data ? true : false
    await Model.User.updateOne({ userId: ctx.session.userId }, { fasting })
    const message = HLanguage(ctx.session.language, 'notifChange')

    ctx.reply(message)
    ctx.scene.exit()
  } else {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
  }
  ctx.answerCallbackQuery()
})

export default scene
