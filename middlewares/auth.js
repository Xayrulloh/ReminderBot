import Model from '#config/database'

export async function authMiddleware(ctx, next) {
  if (ctx.from.is_bot) return
  if (authMiddleware[ctx.from?.id]?.id) {
    ctx.user = authMiddleware[ctx.from?.id]

    return await next()
  }

  const userId = ctx.from?.id
  let user = await Model.User.findOne({ userId })

  if (!user) {
    const isStartSceneActive = ctx.session.scenes?.stack?.some((stack) => stack.scene === 'Start')

    if (isStartSceneActive) {
      await next()
    } else {
      ctx.scenes.enter('Start')
    }
    return
  }

  authMiddleware[user.userId] = user
  ctx.user = user

  await next()
}
