import { Scene } from 'grammy-scenes'
import Model from '#config/database'

const scene = new Scene('Advertise')

scene.do(async (ctx) => {
  if (1151533771 == ctx.message.from.id) {
    ctx.reply('Give me a message to send every user')
  } else {
    ctx.scene.exit()
  }
})

scene.wait().on('message:text', async (ctx) => {
  const users = await Model.User.find()

  for (const user of users) {
    try {
      await ctx.api.sendMessage(user.userId, ctx.message.text)
    } catch (error) {
      if (error.description === 'Forbidden: bot was blocked by the user') {
      } else {
        console.error('Error:', error)
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000 / process.env.LIMIT))
  }

  ctx.scene.exit()
})

export default scene
