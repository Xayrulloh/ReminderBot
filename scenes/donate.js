import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import HLanguage from '#helper/language'
import axios from 'axios'

const scene = new Scene('Donate')

scene.do(async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })
  const message = HLanguage(user.language, 'donateMessage')

  ctx.session.message = message
  ctx.session.language = user.language
  ctx.session.user = user

  ctx.reply(message)
})

scene.wait().on('message:text', async (ctx) => {
  const amount = +ctx.update.message.text

  if (!isNaN(amount) && amount <= 10_000_000 && amount >= 1_000) {
    try {
      const response = await axios.post(process.env.PAYME_URL + 'p2p/create', {
        number: process.env.CARD,
        amount,
      })

      if (!response.data?.success) {
        const message = HLanguage(ctx.session.language, 'donateError')
        ctx.reply(message)
        ctx.scene.exit()
        return
      }

      const endpoint = process.env.PAYME_ENDPOINT + response.data?.result?.chequeid
      const message = HLanguage(ctx.session.language, 'donateUrl')
      const messageThanks = HLanguage(ctx.session.language, 'donateThanks')
      const user = ctx.session.user

      user.donate += amount
      user.save()

      ctx.reply(message + endpoint + '\n\n' + messageThanks)
    } catch (error) {
      const message = HLanguage(ctx.session.language, 'donateError')
      ctx.reply(message)
    }

    ctx.scene.exit()
  } else {
    ctx.reply(ctx.session.message)
  }
})

export default scene
