import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '../keyboard/inline.js'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'

let scene = new Scene('Location')

scene.do(async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })
  const message = HLanguage(user.language, 'chooseRegion')
  const keyboardMessage = HLanguage(user.language, 'region')
  const keyboard = []

  for (let region in keyboardMessage) {
    keyboard.push({ view: region, text: keyboardMessage[region] })
  }

  const buttons = inlineKFunction(3, ...keyboard)

  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.userId = userId
  ctx.session.language = user.language
  ctx.session.regionId = Object.values(keyboardMessage)
  ctx.session.regions = keyboardMessage

  ctx.reply(message, { reply_markup: buttons })
})

scene.wait().on('callback_query:data', async (ctx) => {
  if (ctx.session.regionId.includes(+ctx.update.callback_query.data)) {
    const now = new Date()
    const today = now.getDate()
    const message = HLanguage(ctx.session.language, 'infoPrayTime')
    const data = await Model.PrayTime.findOne({ day: today, regionId: +ctx.update.callback_query.data })
    let regionName = ''

    for (const key in ctx.session.regions) {
      if (ctx.session.regions[key] === data.regionId) {
        regionName = key
        break
      }
    }

    await Model.User.updateOne(
      { userId: ctx.session.userId },
      { region: regionName, regionId: +ctx.update.callback_query.data },
    )

    let response = HReplace(
      message,
      ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
      [data.region, data.fajr, data.sunrise, data.dhuhr, data.asr, data.maghrib, data.isha],
    )

    const locationMessage = HLanguage(ctx.session.language, 'locationChange')

    ctx.reply(locationMessage)
    ctx.reply(response)
    ctx.scene.exit()
  } else {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
  }

  ctx.answerCallbackQuery()
})

export default scene
