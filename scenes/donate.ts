import { Scene } from 'grammy-scenes'
import { t } from '#config/i18n'
import axios from 'axios'
import { BotContext } from '#types/context'
import { env } from '#utils/env'

const scene = new Scene<BotContext>('Donate')

scene.step(async (ctx) => {
  const message = t($ => $.donateMessage)

  ctx.session.message = message

  await ctx.reply(message)
})

scene.wait('amount').on('message:text', async (ctx) => {
  const amount = +ctx.update.message.text

  if (!isNaN(amount) && amount <= 10_000_000 && amount >= 1_000) {
    try {
      const [response] = await Promise.all([
        axios.post(env.PAYME_URL + 'p2p/create', {
          number: env.CARD,
          amount,
        }),
      ])

      if (!response.data?.success) {
        const message = t($ => $.donateError)
        await ctx.reply(message)
        ctx.scene.exit()
        return
      }

      const endpoint = env.PAYME_ENDPOINT + response.data?.result?.chequeid
      const message = t($ => $.donateUrl)
      const messageThanks = t($ => $.donateThanks)

      ctx.user.donate += amount
      ctx.user.save()

      await ctx.reply(message + endpoint + '\n\n' + messageThanks)
    } catch (error) {
      const message = t($ => $.donateError)
      await ctx.reply(message)
    }

    ctx.scene.exit()
  } else {
    await ctx.reply(ctx.session.message)
  }
})

export default scene
