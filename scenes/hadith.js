import { Scene } from 'grammy-scenes'
import Model from '#config/database'

const scene = new Scene('Hadith')

scene.do(async (ctx) => {
  if (1151533771 == ctx.message.from.id) {
    ctx.reply('Give me the hadith')
  } else {
    ctx.reply("You haven't a permission!")
    ctx.scene.exit()
  }
})

scene.wait().on('message:text', async (ctx) => {
  await Model.Hadith.create({
    content: ctx.message.text,
  })

  ctx.reply('Hadith wrote. Thank you')

  ctx.scene.exit()
})

export default scene
