import { BotError } from 'grammy'
import { bold, EmbedBuilder, inlineCode, WebhookClient } from 'discord.js'
import { env } from '#utils/env'

export async function errorHandler(err: BotError) {
  let embed = new EmbedBuilder()
    .setColor('Random')
    .setTitle(err.name)
    .setDescription(
      `
      ${bold('Stage:')} ${env.NODE_ENV}
      ${bold('Id:')} ${inlineCode(String(err.ctx.from?.id))}
      ${bold('FirstName:')} ${err.ctx.from?.first_name}
      ${bold('LastName:')} ${err.ctx.from?.last_name}
      ${bold('Username:')} @${err.ctx.from?.username}
      ${bold('Message:')} ${err.message}
    `,
    )
    .setTimestamp(new Date())

  const discordClient = new WebhookClient({
    url: env.DISCORD_WEBHOOK_URL,
  })

  await discordClient.send({
    threadId: env.DISCORD_THREAD_ID,
    embeds: [embed],
  })
}
