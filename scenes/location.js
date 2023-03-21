import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '../keyboard/inline.js'
import HLanguage from '#helper/language'

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

  ctx.reply(message, { reply_markup: buttons })
})

scene.wait().on('callback_query:data', async (ctx) => {
  if (ctx.session.regionId.includes(+ctx.update.callback_query.data)) {
    const now = new Date()
    const today = now.getDay() + 1
    const message = HLanguage(ctx.session.language, 'infoPrayTime')
    const data = await Model.PrayTime.findOne({ day: today, regionId: +ctx.update.callback_query.data })

    await Model.User.updateOne(
      { userId: ctx.session.userId },
      { region: data.region, regionId: +ctx.update.callback_query.data },
    )

    let response = message.replace('$region', data.region)
    response = response.replace('$fajr', data.fajr)
    response = response.replace('$sunrise', data.sunrise)
    response = response.replace('$zuhr', data.zuhr)
    response = response.replace('$asr', data.asr)
    response = response.replace('$maghrib', data.maghrib)
    response = response.replace('$isha', data.isha)
    const locationMessage = HLanguage(ctx.session.language, 'locationChange')

    ctx.reply(locationMessage)
    ctx.reply(response)
    ctx.scene.exit()
  } else {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons })
  }
})

export default scene
