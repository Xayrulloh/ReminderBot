import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'
import { env } from '#utils/env'

const scene = new Scene<BotContext>('Announcement')

scene.step(async (ctx) => {
  if (1151533771 === ctx.from?.id) {
    await ctx.reply('To whom')
  } else {
    ctx.scene.exit()
  }
})

scene.wait('whom').on('message:text', async (ctx) => {
  ctx.session.whom = ctx.update.message?.text

  await ctx.reply('Give me a message to send')
  ctx.scene.resume()
})

scene.wait('message').on('message:text', async (ctx) => {
  const whereQuery: { deletedAt: null; userId?: number } = {
    deletedAt: null,
  }

  !isNaN(+ctx.session.whom) ? (whereQuery.userId = ctx.session.whom) : false

  const users = await Model.User.find<IUser>(whereQuery)

  for (const user of users) {
    try {
      await ctx.api.sendMessage(user.userId, ctx.message.text)
    } catch (error) {
      if (error.description === 'Forbidden: bot was blocked by the user') {
      } else if (error.description == 'Forbidden: user is deactivated') {
        await Model.User.findOneAndUpdate({ userId: user.userId, deletedAt: null }, { deletedAt: new Date() })
      } else console.error('Error:', error)
    }
  }

  ctx.scene.exit()
})

export default scene
