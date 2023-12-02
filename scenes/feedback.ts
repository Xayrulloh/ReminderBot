import { Scene } from 'grammy-scenes'
import HLanguage from '#helper/language'
import { BotContext } from '#types/context'
import { EmbedBuilder, WebhookClient } from 'discord.js'
import { env } from '#utils/env'
import { format } from 'node:util'
import { FEEDBACK_MESSAGE } from '#utils/constants'
import customKFunction from '#keyboard/custom'

const scene = new Scene<BotContext>('Feedback')

scene.step(async (ctx) => {
  const message = HLanguage('feedbackStartMessage')

  await ctx.reply(message)
})

scene.wait('feedbackStart').on('message:text', async (ctx) => {
  const message = HLanguage('feedbackEndMessage')

  const discordClient = new WebhookClient({
    url: env.DISCORD_WEBHOOK_URL,
  })

  let embed = new EmbedBuilder()
    .setColor('Green')
    .setTitle(`**ID:** ${ctx.from.id}`)
    .setDescription(
      format(
        FEEDBACK_MESSAGE,
        env.NODE_ENV,
        ctx.from.username,
        ctx.from.first_name,
        ctx.from.last_name,
        ctx.message.text,
      ),
    )
    .setTimestamp(new Date())

  await discordClient.send({
    threadId: env.DISCORD_FEEDBACK_THREAD_ID,
    embeds: [embed],
  })

  const keyboardText = HLanguage('mainKeyboard')
  const buttons = customKFunction(2, ...keyboardText)

  await ctx.reply(message, {
    reply_markup: {
      keyboard: buttons.build(),
      resize_keyboard: true,
    },
  })

  ctx.scene.exit()
})

export default scene
