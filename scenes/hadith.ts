import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import { BotContext } from '#types/context'
import { InlineKeyboard } from 'grammy'
import { IHadith } from '#types/database'

const scene = new Scene<BotContext>('Hadith')

scene.step(async (ctx) => {
  if (1151533771 === ctx.from?.id) {
    await ctx.reply('Give me the hadith')
  } else {
    ctx.scene.exit()
  }
})

scene.wait('hadith').on('message:text', async (ctx) => {
  ctx.session.hadith = ctx.message.text

  const categories = await Model.Hadith.distinct<string>('category')

  let buttons: InlineKeyboard | undefined
  if (categories.length) {
    buttons = inlineKFunction(
      5,
      ...categories.map((c) => {
        return { view: c, text: c }
      }),
    )
  }

  await ctx.reply('Give the category of hadith', { reply_markup: buttons })

  ctx.scene.resume()
})

scene.wait('category').on(['message:text', 'callback_query:data'], async (ctx) => {
  await Model.Hadith.create<IHadith>({
    content: ctx.session.hadith,
    category: ctx.callbackQuery?.data || ctx.update.message?.text,
  })

  if (ctx.callbackQuery?.data) {
    await ctx.answerCallbackQuery()

    await ctx.editMessageText('The hadith is written, thank you. You are doing your best :)')
  } else {
    await ctx.reply(message)
  }

  ctx.scene.exit()
})

export default scene
