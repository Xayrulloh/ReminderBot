import axios from 'axios'
import pdfParser from 'pdf-parse'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import schedule from 'node-schedule'

export async function monthly() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const keyboardMessage = HLanguage('en', 'region')
  const regions = Object.keys(keyboardMessage)
  const regionIds = Object.values(keyboardMessage)
  const daysOfWeek = ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба']

  await Model.PrayTime.deleteMany()

  for (let i = 0; i < regions.length; i++) {
    const pdf = await axios.get(process.env.TIME_API + regionIds[i] + '/' + currentMonth, {
      responseType: 'arraybuffer',
    })
    const pdfData = await pdfParser(pdf.data, { normalizeWhitespace: true })
    const data = pdfData.text.split('\n')

    for (let el of data) {
      if (el.length > 20 && el.split(' ').length == 1) {
        for (let day of daysOfWeek) {
          if (el.includes(day)) {
            let dayNumber = el.split(day)[0]
            let times = el.split(day)[1].match(/.{1,5}/g)

            await Model.PrayTime.create({
              region: regions[i],
              regionId: regionIds[i],
              day: dayNumber,
              fajr: times[0],
              sunrise: times[1],
              dhuhr: times[2],
              asr: times[3],
              maghrib: times[4],
              isha: times[5],
            })
          }
        }
      }
    }
  }
}

export async function daily(bot) {
  const now = new Date()
  const currentDay = now.getDate()
  const regions = await Model.PrayTime.find({ day: currentDay })

  for (let region of regions) {
    const users = await Model.User.find({ regionId: region.regionId })

    for (let user of users) {
      const info = HLanguage(user.language, 'infoPrayTime')
      const message = HReplace(
        info,
        ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
        [region.region, region.fajr, region.sunrise, region.dhuhr, region.asr, region.maghrib, region.isha],
      )

      bot.api.sendMessage(user.userId, message).catch(async (error) => {
        if (error.description == 'Forbidden: bot was blocked by the user') {
        }
        await Model.User.deleteOne({ userId: user.userId })
      })
    }
  }
}

export async function reminder(bot) {
  await schedule.gracefulShutdown()

  const now = new Date()
  const currentDay = now.getDate()
  const regions = await Model.PrayTime.find({ day: currentDay })

  for (let region of regions) {
    // times
    const fajr = region.fajr.split(':')
    const sunrise = region.sunrise.split(':')
    const dhuhr = region.dhuhr.split(':')
    const asr = region.asr.split(':')
    const maghrib = region.maghrib.split(':')
    const isha = region.isha.split(':')

    // schedule
    schedule.scheduleJob({ hour: fajr[0], minute: fajr[1] }, async () => {
      const users = await Model.User.find({ regionId: region.regionId, notification: true })

      users.forEach((user) => {
        const message = user.fasting ? HLanguage(user.language, 'closeFast') : HLanguage(user.language, 'fajrTime')

        bot.api.sendMessage(user.userId, message).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
          await Model.User.deleteOne({ userId: user.userId })
        })
      })
    })

    schedule.scheduleJob({ hour: sunrise[0], minute: sunrise[1] }, async () => {
      const users = await Model.User.find({ regionId: region.regionId, notification: true })

      users.forEach((user) => {
        const sunriseTime = HLanguage(user.language, 'sunriseTime')

        bot.api.sendMessage(user.userId, sunriseTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
          await Model.User.deleteOne({ userId: user.userId })
        })
      })
    })

    schedule.scheduleJob({ hour: dhuhr[0], minute: dhuhr[1] }, async () => {
      const users = await Model.User.find({ regionId: region.regionId, notification: true })

      users.forEach((user) => {
        const dhuhrTime = HLanguage(user.language, 'dhuhrTime')

        bot.api.sendMessage(user.userId, dhuhrTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
          await Model.User.deleteOne({ userId: user.userId })
        })
      })
    })

    schedule.scheduleJob({ hour: asr[0], minute: asr[1] }, async () => {
      const users = await Model.User.find({ regionId: region.regionId, notification: true })

      users.forEach((user) => {
        const asrTime = HLanguage(user.language, 'asrTime')

        bot.api.sendMessage(user.userId, asrTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
          await Model.User.deleteOne({ userId: user.userId })
        })
      })
    })

    schedule.scheduleJob({ hour: maghrib[0], minute: maghrib[1] }, async () => {
      const users = await Model.User.find({ regionId: region.regionId, notification: true })

      users.forEach((user) => {
        const message = user.fasting ? HLanguage(user.language, 'closeFast') : HLanguage(user.language, 'fajrTime')

        bot.api.sendMessage(user.userId, message).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
          await Model.User.deleteOne({ userId: user.userId })
        })
      })
    })

    schedule.scheduleJob({ hour: isha[0], minute: isha[1] }, async () => {
      const users = await Model.User.find({ regionId: region.regionId, notification: true })

      users.forEach((user) => {
        const ishaTime = HLanguage(user.language, 'ishaTime')

        bot.api.sendMessage(user.userId, ishaTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
          await Model.User.deleteOne({ userId: user.userId })
        })
      })
    })
  }
}
