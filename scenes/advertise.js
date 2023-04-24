import { Scene } from 'grammy-scenes'
import Model from '#config/database'

const scene = new Scene('Advertise')

scene.do(async (ctx) => {
  if (1151533771 == ctx.message.from.id) {
    ctx.reply('Give me a message to send every user')
  } else {
    ctx.reply("You haven't a permission!")
    ctx.scene.exit()
  }
})

scene.wait().on('message:text', async (ctx) => {
  const users = await Model.User.find()

  users.forEach(async (user) => {
    ctx.api.sendMessage(user.userId, ctx.message.text).catch(async (error) => {
      if (error.description == 'Forbidden: bot was blocked by the user') {
        // await Model.User.deleteOne({ userId: user.userId })
      }
    })
  })
  ctx.scene.exit()
})

export default scene
