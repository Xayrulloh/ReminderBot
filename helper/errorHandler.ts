import { BotError, GrammyError } from 'grammy'
import { bold, EmbedBuilder, inlineCode, WebhookClient } from 'discord.js'
import { env } from '#utils/env'
import Model from '#config/database'
import { IUser } from '#types/database'

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

export async function handleSendMessageError(error: GrammyError, user: IUser) {
  switch (error.description) {
    case 'Forbidden: bot was blocked by the user': {
      await Model.User.updateOne({ userId: user.userId }, { status: false })
      break
    }
    case 'Forbidden: user is deactivated': {
      await Model.User.updateOne({ userId: user.userId }, { deletedAt: new Date() })
      break
    }
    default: {
      console.error(error)
    }
  }
}
