import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import HLanguage from '#helper/language'
import { InlineKeyboard } from 'grammy'
import { env } from '#utils/env'

const scene = new Scene<BotContext>('Quran')

scene.step(async (ctx) => {
  const message = HLanguage("share_qu'ron_va_tafsiri")
  const keyboard = new InlineKeyboard()
  const enterMessage = HLanguage('enter')
  const addToGroupMessage = HLanguage('addToGroup')

  keyboard.url(enterMessage, env.QURON_VA_TAFSIRI_URL)
  keyboard.row()
  keyboard.url(addToGroupMessage, 'https://t.me/' + ctx.me.username + '?startgroup=' + ctx.me.username)

  await ctx.reply(message, { reply_markup: keyboard })

  ctx.scene.exit()
})

export default scene
