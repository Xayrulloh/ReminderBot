import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '../keyboard/inline.js'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import fs from 'fs'
import path from 'path'

let scene = new Scene('Search')

scene.do(async (ctx) => {
  const message = HLanguage(ctx.user.language, 'searchRegion')
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

  ctx.reply(message, { reply_markup: buttons })
})

scene.wait().on('callback_query:data', async (ctx) => {
  if (ctx.session.regionId.includes(+ctx.update.callback_query.data)) {
    const now = new Date()
    const today = now.getDate()

    const message = HLanguage(ctx.user.language, 'infoPrayTime')
    const data = await Model.PrayTime.findOne({ day: today, regionId: ctx.update.callback_query.data })
    let regionName = ''

    for (const key in ctx.session.regions) {
      if (ctx.session.regions[key] === data.regionId) {
        regionName = key
        break
      }
    }

    let response = HReplace(
      message,
      ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
      [data.region, data.fajr, data.sunrise, data.dhuhr, data.asr, data.maghrib, data.isha],
    )

    const dailyHadith = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'translate', 'localStorage.json')),
    )?.dailyHadith

    ctx.reply(response + dailyHadith)
    ctx.scene.exit()
  } else {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
  }

  ctx.answerCallbackQuery()
})

export default scene
