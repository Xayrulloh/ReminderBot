import { Scene } from 'grammy-scenes'
import { t } from '#config/i18n'
import type { BotContext } from '#types/context'

const scene = new Scene<BotContext>('Source')

scene.step(async (ctx) => {
  const sourceReplyMessage = t(($) => $.sourceMessage, {
    siteLink: 'https://new.islom.uz',
    sourceLink: 'https://www.ziyouz.com/books/islomiy/hadis/Imom%20Navaviy.%20Riyozus%20solihiyn.pdf',
  })

  await ctx.reply(`*Manbalar*:\n\n${sourceReplyMessage}`, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  })
  ctx.scene.exit()
})

export default scene
