import { GrammyError, type NextFunction } from 'grammy'
import Model from '#config/database'
import { t } from '#config/i18n'
import { memoryStorage } from '#config/storage'
import { handleGroupSendMessageError } from '#helper/errorHandler'
import type { BotContext } from '#types/context'
import type { IGroup, IUser } from '#types/database'

export async function userAuthMiddleware(ctx: BotContext, next: NextFunction) {
  if (!ctx.from) return next()

  if (ctx.from.is_bot) return

  // Caching to memory
  const key = String(ctx.from?.id)
  let user = memoryStorage.read(key) as IUser | undefined

  if (user) {
    ctx.user = user

    return next()
  }

  // finding user from db
  const userId = ctx.from?.id

  user = (await Model.User.findOne<IUser>({ userId })) ?? undefined

  if (!user) {
    const isStartSceneActive = ctx.session.scenes?.stack?.some((stack) => stack.scene === 'Start')

    if (isStartSceneActive) {
      return next()
    } else {
      return ctx.scenes.enter('Start')
    }
  }

  memoryStorage.write(key, user)

  ctx.user = user

  return next()
}

export async function groupAuthMiddleware(ctx: BotContext, next: NextFunction) {
  if (!ctx.chat) return next()

  // 1. caching to memory (read)
  const key = String(ctx.chat.id)
  let group = memoryStorage.read(key) as IGroup | undefined

  // 2. if not in memory, try db
  if (!group) {
    const groupId = ctx.chat.id

    group = (await Model.Group.findOne<IGroup>({ groupId })) ?? undefined

    if (group) {
      memoryStorage.write(key, group)
    }
  }

  // 3. if still no group, enter setup (non admin is ok)
  if (!group || !group.status) {
    if (ctx.session.scenes?.stack?.some((stack) => stack.scene === 'GroupStart')) {
      return next()
    }

    return ctx.scenes.enter('GroupStart')
  }

  // if the group is found, attach it to context
  ctx.group = group

  // 4. Check for admin
  const isInteractingWithBot =
    ctx.message?.entities?.some((entity) => entity.type === 'bot_command') ||
    ctx.message?.caption_entities?.some((entity) => entity.type === 'bot_command') ||
    ctx.message?.reply_to_message?.from?.id === ctx.me?.id ||
    (ctx.me?.username &&
      (ctx.message?.text?.includes(`@${ctx.me.username}`) || ctx.message?.caption?.includes(`@${ctx.me.username}`)))

  if (!isInteractingWithBot) return next()

  if (ctx.from && !ctx.myChatMember) {
    try {
      const admins = await ctx.getChatAdministrators()

      if (!admins.some((admin) => admin.user.id === ctx.from?.id)) {
        await ctx.reply(t(($) => $.nonAdminPermission)).catch((e) => {
          if (group) {
            handleGroupSendMessageError(e, group)
          }
        })

        return
      }
    } catch (e) {
      if (e instanceof GrammyError) {
        await handleGroupSendMessageError(e, group)

        return
      }

      console.error('Failed to check admins:', e)

      return
    }
  }

  return next()
}
