import Model from '#config/database'
import { BotContext } from '#types/context'
import { NextFunction, GrammyError } from 'grammy'
import { memoryStorage } from '#config/storage'
import { IGroup, IUser } from '#types/database'
import HLanguage from '#helper/language'
import { handleGroupSendMessageError } from '#helper/errorHandler'

export async function userAuthMiddleware(ctx: BotContext, next: NextFunction) {
  if (!ctx.from) return next()

  if (ctx.from.is_bot) return

  // Caching to memory
  const key = String(ctx.from?.id)
  let user = memoryStorage.read(key)

  if (user) {
    ctx.user = user

    return next()
  }

  // finding user from db
  const userId = ctx.from?.id

  user = await Model.User.findOne<IUser>({ userId })

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
  let group = memoryStorage.read(key)

  // 2. if not in memory, try db
  if (!group) {
    const groupId = ctx.chat.id

    group = await Model.Group.findOne<IGroup>({ groupId })

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
  if (ctx.from && !ctx.myChatMember) {
    try {
      const admins = await ctx.getChatAdministrators()

      if (!admins.some((admin) => admin.user.id === ctx.from!.id)) {
        await ctx.reply(HLanguage('nonAdminPermission')).catch((e) => {
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
