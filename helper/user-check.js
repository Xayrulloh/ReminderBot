import Model from '#config/database'

export async function HCheck(ctx) {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')
}
