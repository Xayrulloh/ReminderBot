import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import { t } from '#config/i18n'
import { InlineKeyboard } from 'grammy'
import { env } from '#utils/env'

const scene = new Scene<BotContext>('Quran')

scene.step(async (ctx) => {
  const message = t($ => $.shareQuranVaTafsiri)
  const keyboard = new InlineKeyboard()
  const enterMessage = t($ => $.enter)
  const addToGroupMessage = t($ => $.addToGroup)

  keyboard.url(enterMessage, env.QURON_VA_TAFSIRI_URL)
  keyboard.row()
  keyboard.url(addToGroupMessage, 'https://t.me/' + ctx.me.username + '?startgroup=' + ctx.me.username)

  await ctx.reply(message, { reply_markup: keyboard })

  ctx.scene.exit()
})

export default scene
