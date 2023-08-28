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
  ctx.session.hadith = ctx.message.text

  ctx.reply('Give the category of hadith')

  ctx.scene.resume()
})

scene.wait().on('message:text', async (ctx) => {
  const category = ctx.message.text == 'not' ? undefined : ctx.message.text

  const data = await Model.Hadith.create({
    content: ctx.session.hadith,
    category,
  })

  ctx.reply('Hadith wrote thank you. You are doing your best')

  ctx.scene.exit()
})

export default scene
