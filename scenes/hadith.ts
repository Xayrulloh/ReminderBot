import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { BotContext } from '#types/context'
import { IHadith } from '#types/database'
import { t } from '#config/i18n'
import { InlineKeyboard } from 'grammy'
import { blockQuote } from '#helper/html'

const scene = new Scene<BotContext>('Hadith')

scene.step(async (ctx) => {
  const keyboard = new InlineKeyboard()
  const enterMessage = t($ => $.enter)
  const addToGroupMessage = t($ => $.addToGroup)

  let hadith: IHadith[] | string = await Model.Hadith.aggregate<IHadith>([{ $sample: { size: 1 } }])

  hadith = blockQuote(hadith[0]?.content || 'Hozircha hadis mavjud emas')

  keyboard.url(enterMessage, 'https://t.me/' + ctx.me.username)
  keyboard.row()
  keyboard.url(addToGroupMessage, 'https://t.me/' + ctx.me.username + '?startgroup=' + ctx.me.username)

  await ctx.reply(hadith, { parse_mode: 'HTML', reply_markup: keyboard })

  ctx.scene.exit()
})

export default scene
