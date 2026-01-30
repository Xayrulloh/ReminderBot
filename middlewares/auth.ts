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

  // 2. if new group, let it enter to GroupStart scene
  if (!group) {
    const groupId = ctx.chat?.id

    if (groupId) {
      group = await Model.Group.findOne<IGroup>({ groupId })
    }

    return ctx.scenes.enter('GroupStart')
  } else if (ctx.session.scenes?.stack?.some((stack) => stack.scene === 'GroupStart')) {
    // 3. if ctx is still in GroupStart scene, let it continue
    return next()
  } else if (group && group.status && ctx.message?.text?.split(' ')[0] === '/start') {
    // 4. if group is active, and command is /start, send botregistered message
    return ctx.reply(HLanguage('botRegistered')).catch((e) => {
      handleGroupSendMessageError(e, group)
    })
  } else if (group && !group.status) {
    // 5. if group is not active, immediately enter to GroupStart scene
    return ctx.scenes.enter('GroupStart')
  } else {
    // 6. for all other cases, check for admins, if admin, let it continue, else send nonadmin message
    if (ctx.from && !ctx.myChatMember) {
      try {
        const admins = await ctx.getChatAdministrators()

        if (!admins.some((admin) => admin.user.id === ctx.from!.id)) {
          await ctx.reply(HLanguage('nonAdminPermission')).catch((e) => {
            handleGroupSendMessageError(e, group)
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
}
