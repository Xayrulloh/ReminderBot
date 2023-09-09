import axios from 'axios'
import pdfParser from 'pdf-parse'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import schedule from 'node-schedule'
import customKFunction from '../keyboard/custom.js'
import fs from 'fs'
import { InputFile } from 'grammy'
import path from 'path'

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
  // daily backup
  const users = await Model.User.find()
  fs.access('users.json', fs.constants.F_OK, (err) => {
    if (err) fs.writeFileSync('users.json', JSON.stringify(users))
    else {
      const currentUsers = JSON.parse(fs.readFileSync('users.json'))
      if (currentUsers.length > users.length) fs.writeFileSync('users.json', JSON.stringify(users))
    }
  })

  // sending message
  const now = new Date()
  const currentDay = now.getDate()
  const regions = await Model.PrayTime.find({ day: currentDay })

  // taking hadith
  if (now.getDay() == 5) {
    var hadith = await Model.Hadith.find({ category: 'juma' })
    hadith = hadith[(Math.random() * hadith.length) | 0]
  } else {
    var hadith = await Model.Hadith.find({ category: { $ne: 'juma' } })
    hadith = hadith[(Math.random() * hadith.length) | 0]
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'translate', 'localStorage.json'),
    JSON.stringify({ dailyHadith: hadith ? `\n\n${hadith.content}` : '' }),
    'utf8',
  )

  for (let region of regions) {
    const users = await Model.User.find({ regionId: region.regionId })

    for (let user of users) {
      const info = HLanguage(user.language, 'infoPrayTime')
      let message = HReplace(
        info,
        ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
        [region.region, region.fajr, region.sunrise, region.dhuhr, region.asr, region.maghrib, region.isha],
      )

      const keyboardText = HLanguage(user.language, 'mainKeyboard')
      const buttons = customKFunction(2, ...keyboardText)

      if (now.getDay() == 5) {
        bot.api
          .sendPhoto(user.userId, new InputFile('./uploads/JumaMuborak.jpg'), {
            caption: message + (hadith ? `\n\n${hadith.content}` : ''),
            reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
          })
          .then(() => {
            user.status = true
          })
          .catch(async (error) => {
            if (error.description == 'Forbidden: bot was blocked by the user') {
              user.status = false
            }
          })
          .finally(() => {
            user.save()
          })
        return
      } else {
        bot.api
          .sendMessage(user.userId, message + (hadith ? `\n\n${hadith.content}` : ''), {
            reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
          })
          .then(() => {
            user.status = true
          })
          .catch(async (error) => {
            if (error.description == 'Forbidden: bot was blocked by the user') {
              user.status = false
            }
          })
          .finally(() => {
            user.save()
          })
      }
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
      const users = await Model.User.find({
        regionId: region.regionId,
        notification: true,
        "notificationSetting.fajr": true,
      })

      users.forEach((user) => {
        let message

        if (user.fasting) {
          message = HLanguage(user.language, 'closeFast')
          message += `\n\nنَوَيْتُ أَنْ أَصُومَ صَوْمَ شَهْرَ رَمَضَانَ مِنَ الْفَجْرِ إِلَى الْمَغْرِبِ، خَالِصًا لِلهِ تَعَالَى أَللهُ أَكْبَرُ\n\nНавайту ан асувма совма шаҳри рамазона минал фажри илал мағриби, холисан лиллаҳи таъаалаа Аллоҳу акбар`
        } else {
          message = HLanguage(user.language, 'fajrTime')
        }

        bot.api.sendMessage(user.userId, message).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
        })
      })
    })

    schedule.scheduleJob({ hour: sunrise[0], minute: sunrise[1] }, async () => {
      const users = await Model.User.find({
        regionId: region.regionId,
        notification: true,
        "notificationSetting.sunrise": true,
      })

      users.forEach((user) => {
        const sunriseTime = HLanguage(user.language, 'sunriseTime')

        bot.api.sendMessage(user.userId, sunriseTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
        })
      })
    })

    schedule.scheduleJob({ hour: dhuhr[0], minute: dhuhr[1] }, async () => {
      const users = await Model.User.find({
        regionId: region.regionId,
        notification: true,
        "notificationSetting.dhuhr": true,
      })
      users.forEach((user) => {
        const dhuhrTime = HLanguage(user.language, 'dhuhrTime')

        bot.api.sendMessage(user.userId, dhuhrTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
        })
      })
    })

    schedule.scheduleJob({ hour: asr[0], minute: asr[1] }, async () => {
      const users = await Model.User.find({
        regionId: region.regionId,
        notification: true,
        "notificationSetting.asr": true,
      })

      users.forEach((user) => {
        const asrTime = HLanguage(user.language, 'asrTime')

        bot.api.sendMessage(user.userId, asrTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
        })
      })
    })

    schedule.scheduleJob({ hour: maghrib[0], minute: maghrib[1] }, async () => {
      const users = await Model.User.find({
        regionId: region.regionId,
        notification: true,
        "notificationSetting.maghrib": true,
      })

      users.forEach((user) => {
        let message

        if (user.fasting) {
          message = HLanguage(user.language, 'breakFast')
          message += `\n\nاَللَّهُمَّ لَكَ صُمْتُ وَ بِكَ آمَنْتُ وَ عَلَيْكَ تَوَكَّلْتُ وَ عَلَى رِزْقِكَ أَفْتَرْتُ، فَغْفِرْلِى مَا قَدَّمْتُ وَ مَا أَخَّرْتُ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ\n\nАллоҳумма лака сумту ва бика ааманту ва аълайка таваккалту ва аълаа ризқика афтарту, фағфирлий ма қоддамту ва маа аххорту бироҳматика йаа арҳамар рооҳимийн`
        } else {
          message = HLanguage(user.language, 'maghribTime')
        }

        bot.api.sendMessage(user.userId, message).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
        })
      })
    })

    schedule.scheduleJob({ hour: isha[0], minute: isha[1] }, async () => {
      const users = await Model.User.find({
        regionId: region.regionId,
        notification: true,
        "notificationSetting.isha": true,
      })

      users.forEach((user) => {
        const ishaTime = HLanguage(user.language, 'ishaTime')

        bot.api.sendMessage(user.userId, ishaTime).catch(async (error) => {
          if (error.description == 'Forbidden: bot was blocked by the user') {
          }
        })
      })
    })
  }
}

export async function weekly(bot) {
  const users = await Model.User.find()

  for (const user of users) {
    const message = HLanguage(user.language, 'shareBot')

    bot.api.sendMessage(user.userId, message).catch(async (error) => {
      if (error.description == 'Forbidden: bot was blocked by the user') {
      }
    })
  }
}
