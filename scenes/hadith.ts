import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { BotContext } from '#types/context'
import { IHadith } from '#types/database'

const scene = new Scene<BotContext>('Hadith')

scene.step(async (ctx) => {
  let hadith: IHadith[] | string = await Model.Hadith.aggregate<IHadith>([{ $sample: { size: 1 } }])

  hadith = '\n\n<pre>' + hadith[0]?.content + '</pre>'

  await ctx.reply(hadith, { parse_mode: 'HTML' })

  ctx.scene.exit()
})

export default scene
