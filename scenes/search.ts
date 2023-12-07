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

  const buttons = inlineKFunction(3, keyboard)

  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.regionId = Object.values(keyboardMessage)
  ctx.session.regions = keyboardMessage
  ctx.session.currPage = 1
  ctx.session.keyboard = keyboard

  await ctx.reply(message, { reply_markup: buttons })
})

scene.wait('region').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update.callback_query.data

  if (ctx.session.regionId.includes(+inputData) || ['<', '>'].includes(inputData)) {
    if (['<', '>', 'pageNumber'].includes(inputData)) {
      if (inputData == '<' && ctx.session.currPage != 1) {
        await ctx.answerCallbackQuery()

        ctx.session.buttons = inlineKFunction(3, ctx.session.keyboard, --ctx.session.currPage)

        await ctx.editMessageText(ctx.session.message, { reply_markup: ctx.session.buttons })
      } else if (inputData == '>' && ctx.session.currPage * 12 <= ctx.session.regionId.length) {
        await ctx.answerCallbackQuery()

        ctx.session.buttons = inlineKFunction(3, ctx.session.keyboard, ++ctx.session.currPage)

        await ctx.editMessageText(ctx.session.message, { reply_markup: ctx.session.buttons })
      } else {
        await ctx.answerCallbackQuery(HLanguage('wrongSelection'))
      }
    } else {
      await ctx.answerCallbackQuery()

      const now = new Date()
      const today = now.getDate()

      const message = HLanguage('infoPrayTime')
      const data = await Model.PrayTime.findOne<IPrayTime>({ day: today, regionId: inputData })

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
    }
  } else {
    await ctx.answerCallbackQuery(HLanguage('wrongSelection'))
  }
})

export default scene
