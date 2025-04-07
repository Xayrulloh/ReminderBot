import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { BotContext } from '#types/context'
import { IHadith } from '#types/database'
import HLanguage from '#helper/language'
import { InlineKeyboard } from 'grammy'

const scene = new Scene<BotContext>('Hadith')

scene.step(async (ctx) => {
  const keyboard = new InlineKeyboard()
  const enterMessage = HLanguage('enter')
  let hadith: IHadith[] | string = await Model.Hadith.aggregate<IHadith>([{ $sample: { size: 1 } }])

  hadith = blockQuote(hadith[0]?.content || 'Hozircha hadis mavjud emas')

  keyboard.url(enterMessage, 'https://t.me/' + ctx.me.username)

  await ctx.reply(hadith, { parse_mode: 'HTML', reply_markup: keyboard })

  ctx.scene.exit()
})

export default scene
