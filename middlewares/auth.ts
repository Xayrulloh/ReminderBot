import Model from '#config/database'
import { BotContext } from '#types/context'
import { NextFunction } from 'grammy'
import { memoryStorage } from '#config/storage'
import { IGroup, IUser } from '#types/database'
import HLanguage from '#helper/language'

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

  // check if admin
  if (ctx.from && !ctx.myChatMember) {
    try {
      const admins = await ctx.getChatAdministrators()

      if (!admins.some((admin) => admin.user.id === ctx.from!.id)) {
        return ctx.reply(HLanguage('nonAdminPermission'))
      }
    } catch (e) {
      console.error('Failed to check admins:', e)

      return
    }
  }

  // Caching to memory (Group)
  const key = String(ctx.chat.id)
  let group = memoryStorage.read(key)

  if (group) {
    ctx.group = group

    return next()
  }

  const groupId = ctx.chat?.id

  if (!groupId) return next()

  group = await Model.Group.findOne<IGroup>({ groupId })

  if (!group) {
    if (ctx.session.scenes?.stack?.some((stack) => stack.scene === 'GroupStart')) {
      return next()
    } else {
      return ctx.scenes.enter('GroupStart')
    }
  }

  memoryStorage.write(key, group)

  ctx.group = group

  return next()
}
