import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import dayjs from '#utils/dayjs'

const scene = new Scene<BotContext>('Source')

scene.step(async (ctx) => {
  let sourceReplyMessage = HLanguage('sourceMessage')
  const regionTimeLink = 'https://islom.uz/vaqtlar/' + ctx.user.regionId + '/' + (dayjs().get('month') + 1)

  sourceReplyMessage = HReplace(
    sourceReplyMessage,
    ['$siteLink', '$sourceLink'],
    [regionTimeLink, 'https://www.ziyouz.com/books/islomiy/hadis/Imom%20Navaviy.%20Riyozus%20solihiyn.pdf'],
  )

  await ctx.reply('*Manbalar*:\n\n' + sourceReplyMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  })
  ctx.scene.exit()
})

export default scene
