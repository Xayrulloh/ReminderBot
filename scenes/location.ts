import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import { BotContext } from '#types/context'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IPrayTime, IUser } from '#types/database'

let scene = new Scene<BotContext>('Location')

scene.do(async (ctx) => {
  const message = HLanguage(ctx.user.language, 'chooseRegion')
  const keyboardMessage = HLanguage(ctx.user.language, 'region')
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

scene.wait().on('callback_query:data', async (ctx) => {
  if (ctx.session.regionId.includes(+ctx.update.callback_query.data)) {
    await ctx.answerCallbackQuery()

    const now = new Date()
    const today = now.getDate()
    const message = HLanguage(ctx.user.language, 'infoPrayTime')
    const data = await Model.PrayTime.findOne<IPrayTime>({ day: today, regionId: +ctx.update.callback_query.data })
    let regionName = ''

    if (!data) return ctx.scene.exit()

    for (const key in ctx.session.regions) {
      if (ctx.session.regions[key] === data.regionId) {
        regionName = key
        break
      }
    }

    await Model.User.updateOne<IUser>(
      { userId: ctx.user.userId },
      { region: regionName, regionId: +ctx.update.callback_query.data },
    )

    let response = HReplace(
      message,
      ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
      [data.region, data.fajr, data.sunrise, data.dhuhr, data.asr, data.maghrib, data.isha],
    )
    const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String()

    const locationMessage = HLanguage(ctx.user.language, 'locationChange')

    await ctx.editMessageText(locationMessage + '\n\n' + response + '\n\n' + dailyHadith)
    ctx.scene.exit()
  } else {
    await ctx.answerCallbackQuery(HLanguage(ctx.user.language, 'wrongSelection'))
  }
})

export default scene
