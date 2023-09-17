import Model from '#config/database'
import { inlineQuery } from '../query/inline.js'

export async function authMiddleware(ctx, next) {
  if (ctx.from.is_bot) return

  // if inline query
  if (ctx.update?.inline_query?.id) {
    return inlineQuery(ctx)
  }

  // if user exist in cache
  if (authMiddleware[ctx.from?.id]?.id) {
    ctx.user = authMiddleware[ctx.from?.id]

    return next()
  }

  // finding user from db
  const userId = ctx.from?.id
  let user = await Model.User.findOne({ userId })

  if (!user) {
    const isStartSceneActive = ctx.session.scenes?.stack?.some((stack) => stack.scene === 'Start')

    if (isStartSceneActive) {
      return next()
    } else {
      return ctx.scenes.enter('Start')
    }
  }

  authMiddleware[user.userId] = user
  ctx.user = user

  return next()
}
