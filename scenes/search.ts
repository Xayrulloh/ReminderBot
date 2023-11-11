import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import { BotContext } from '#types/context'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IPrayTime } from '#types/database'

let scene = new Scene<BotContext>('Search')

scene.step(async (ctx) => {
  const message = HLanguage('searchRegion')
  // FIXME: Refactor duplication on location.ts (15-29 lines)
  const keyboardMessage = HLanguage('region')
  const keyboard = []

  for (let region in keyboardMessage) {
    keyboard.push({ view: region, text: keyboardMessage[region] })
  }

  const buttons = inlineKFunction(3, ...keyboard)

  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.regionId = Object.values(keyboardMessage)
  ctx.session.regions = keyboardMessage

  await ctx.reply(message, { reply_markup: buttons })
})

scene.wait('region').on('callback_query:data', async (ctx) => {
  if (ctx.session.regionId.includes(+ctx.update.callback_query.data)) {
    await ctx.answerCallbackQuery()

    const now = new Date()
    const today = now.getDate()

    const message = HLanguage('infoPrayTime')
    const data = await Model.PrayTime.findOne<IPrayTime>({ day: today, regionId: ctx.update.callback_query.data })

    if (!data) return ctx.scene.exit()

    let response = HReplace(
      message,
      ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
      [data.region, data.fajr, data.sunrise, data.dhuhr, data.asr, data.maghrib, data.isha],
    )

    const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String()

    await ctx.deleteMessage()
    await ctx.reply(response + dailyHadith, { parse_mode: 'HTML' })
    ctx.scene.exit()
  } else {
    await ctx.answerCallbackQuery(HLanguage('wrongSelection'))
  }
})

export default scene
