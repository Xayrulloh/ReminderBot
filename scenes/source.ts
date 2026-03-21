import { Scene } from 'grammy-scenes'
import { t } from '#config/i18n'
import type { BotContext } from '#types/context'

const scene = new Scene<BotContext>('Source')

scene.step(async (ctx) => {
  const sourceReplyMessage = t(($) => $.sourceMessage, {
    sourceLink: 'https://www.ziyouz.com/books/islomiy/hadis/Imom%20Navaviy.%20Riyozus%20solihiyn.pdf',
  })

  await ctx.reply(`*Manbalar*:\n\n${sourceReplyMessage}`, {
    parse_mode: 'Markdown',
    link_preview_options: { is_disabled: true },
  })
  ctx.scene.exit()
})

export default scene
