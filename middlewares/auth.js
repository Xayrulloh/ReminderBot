import Model from '#config/database'

export async function authMiddleware(ctx, next) {
  if (ctx.from.is_bot) return

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

  ctx.user = user

  await next()
}
