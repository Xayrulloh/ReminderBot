import { Scene } from 'grammy-scenes'
import HLanguage from '#helper/language'
import axios from 'axios'
import { BotContext } from '#types/context'
import { env } from '#utils/env'

const scene = new Scene<BotContext>('Donate')

scene.do(async (ctx) => {
  const message = HLanguage(ctx.user.language, 'donateMessage')

  ctx.session.message = message

  await ctx.reply(message)
})

scene.wait().on('message:text', async (ctx) => {
  const amount = +ctx.update.message.text

  if (!isNaN(amount) && amount <= 10_000_000 && amount >= 1_000) {
    try {
      const [response] = await Promise.all([
        axios.post(env.paymeUrl + 'p2p/create', {
          number: env.card,
          amount,
        }),
      ])

      if (!response.data?.success) {
        const message = HLanguage(ctx.user.language, 'donateError')
        ctx.reply(message)
        ctx.scene.exit()
        return
      }

      const endpoint = env.paymeEndpoint + response.data?.result?.chequeid
      const message = HLanguage(ctx.user.language, 'donateUrl')
      const messageThanks = HLanguage(ctx.user.language, 'donateThanks')

      ctx.user.donate += amount
      ctx.user.save()

      ctx.reply(message + endpoint + '\n\n' + messageThanks)
    } catch (error) {
      const message = HLanguage(ctx.user.language, 'donateError')
      ctx.reply(message)
    }

    ctx.scene.exit()
  } else {
    ctx.reply(ctx.session.message)
  }
})

export default scene
