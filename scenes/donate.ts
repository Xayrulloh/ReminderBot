import axios from 'axios'
import { Scene } from 'grammy-scenes'
import { t } from '#config/i18n'
import type { BotContext } from '#types/context'
import { env } from '#utils/env'

const scene = new Scene<BotContext>('Donate')

scene.step(async (ctx) => {
  await ctx.reply(t(($) => $.donateMessage))
})

scene.wait('amount').on('message:text', async (ctx) => {
  const amount = +ctx.update.message.text

  if (!Number.isNaN(amount) && amount <= 10_000_000 && amount >= 1_000) {
    try {
      const [response] = await Promise.all([
        axios.post(`${env.PAYME_URL}p2p/create`, {
          number: env.CARD,
          amount,
        }),
      ])

      if (!response.data?.success) {
        const message = t(($) => $.donateError)
        await ctx.reply(message)
        ctx.scene.exit()
        return
      }

      const endpoint = env.PAYME_ENDPOINT + response.data?.result?.chequeid
      const message = t(($) => $.donateUrl)
      const messageThanks = t(($) => $.donateThanks)

      ctx.user.donate += amount
      await ctx.user.save()

      await ctx.reply(`${message + endpoint}\n\n${messageThanks}`)
    } catch (_error) {
      const message = t(($) => $.donateError)
      await ctx.reply(message)
    }

    ctx.scene.exit()
  } else {
    await ctx.reply(t(($) => $.donateMessage))
  }
})

export default scene
