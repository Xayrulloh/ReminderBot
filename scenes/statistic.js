import { Scene } from 'grammy-scenes'
import Model from '#config/database'

const scene = new Scene('Statistic')

scene.do(async (ctx) => {
  if ([1151533771].includes(ctx.message.from.id)) {
    const users = await Model.User.find()

    ctx.reply('All users are ' + users.length)
    ctx.scene.exit()
  } else {
    ctx.reply("You haven't a permission!")
    ctx.scene.exit()
  }
})

export default scene
