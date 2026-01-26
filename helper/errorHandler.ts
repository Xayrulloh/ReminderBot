import { BotError, GrammyError } from 'grammy'
import { EmbedBuilder, WebhookClient } from 'discord.js'
import { env } from '#utils/env'
import Model from '#config/database'
import { IGroup, IUser } from '#types/database'
import { format } from 'node:util'
import { ErrorType } from '#types/error'
import { ERROR_MESSAGE } from '#utils/constants'

export async function errorHandler(err: BotError) {
  const error: ErrorType = {
    name: err.name,
    stage: env.NODE_ENV,
    message: err.message,
    id: err.ctx?.from?.id,
    firstName: err.ctx?.from?.first_name,
    lastName: err.ctx?.from?.last_name,
    username: err.ctx?.from?.username,
  }

  let description = Object.entries(error).reduce((desc, [key, value]) => {
    if (value) {
      desc += format(ERROR_MESSAGE[key as keyof ErrorType], value)
    }

    return desc
  }, '')

  let embed = new EmbedBuilder().setColor('Red').setTitle(err.name).setDescription(description).setTimestamp(new Date())

  const discordClient = new WebhookClient({
    url: env.DISCORD_WEBHOOK_URL,
  })

  await discordClient.send({
    threadId: env.DISCORD_LOGS_THREAD_ID,
    embeds: [embed],
  })

  // Check it out for more information
  console.error(err)
}

export async function handleUserSendMessageError(error: GrammyError, user: IUser) {
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

export async function handleGroupSendMessageError(error: GrammyError, group: IGroup) {
  switch (error.description) {
    case 'Forbidden: bot was kicked from the group chat': {
      await Model.Group.updateOne({ groupId: group.groupId }, { status: false })

      break
    }
    case 'Bad Request: chat not found': {
      await Model.Group.updateOne({ groupId: group.groupId }, { deletedAt: new Date() })

      break
    }
    default: {
      if (error.error_code === 403) {
        await Model.Group.updateOne({ groupId: group.groupId }, { status: false })
      } else {
        console.error(error)
      }
    }
  }
}
