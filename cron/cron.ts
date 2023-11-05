import axios from 'axios'
import pdfParser from 'pdf-parse'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import schedule from 'node-schedule'
import customKFunction from '#keyboard/custom'
import { Bot, InlineKeyboard } from 'grammy'
import { BotContext } from '#types/context'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IHadith, IPrayTime, IUser } from '#types/database'
import { env } from '#utils/env'
import cron from 'node-cron'
import { handleSendMessageError } from '#helper/errorHandler'

async function monthly() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const keyboardMessage = HLanguage('region')
  const regions = Object.keys(keyboardMessage)
  const regionIds = Object.values(keyboardMessage)
  const daysOfWeek = ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба']

  await Model.PrayTime.deleteMany()

  for (let i = 0; i < regions.length; i++) {
    const pdf = await axios.get(env.TIME_API + regionIds[i] + '/' + currentMonth, {
      responseType: 'arraybuffer',
    })
    const pdfData = await pdfParser(pdf.data)
    const data = pdfData.text.split('\n')

    for (let el of data) {
      if (el.length > 20 && el.split(' ').length == 1) {
        for (let day of daysOfWeek) {
          if (el.includes(day)) {
            let dayNumber = el.split(day)[0]
            let times = el.split(day)[1].match(/.{1,5}/g) as RegExpMatchArray

            await Model.PrayTime.create<IPrayTime>({
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

async function daily(bot: Bot<BotContext>) {
  // taking data
  const now = new Date()
  const monthDay = now.getDate()
  const weekDay = now.getDay()
  const regions = await Model.PrayTime.find<IPrayTime>({ day: monthDay })

  // taking hadith
  let hadith: IHadith[]
  // const file = new InputFile('./public/JumaMuborak.jpg')
  if (weekDay == 5) {
    hadith = await Model.Hadith.find<IHadith>({ category: 'juma' })
  } else {
    hadith = await Model.Hadith.find<IHadith>({ category: { $ne: 'juma' } })
  }
  const randomHadith = hadith[(Math.random() * hadith.length) | 0]

  // Set daily hadith to storage
  memoryStorage.write(DAILY_HADITH_KEY, randomHadith.content)

  // sending
  for (let region of regions) {
    const users = await Model.User.find<IUser>({
      regionId: region.regionId,
      deletedAt: null,
      status: true,
    })

    for (let user of users) {
      const info = HLanguage('infoPrayTime')
      let message = HReplace(
        info,
        ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
        [region.region, region.fajr, region.sunrise, region.dhuhr, region.asr, region.maghrib, region.isha],
      )

      const keyboardText = HLanguage('mainKeyboard')
      const buttons = customKFunction(2, ...keyboardText)

      try {
        await bot.api.sendMessage(
          user.userId,
          message + (randomHadith ? `\n\n<b>Kunlik hadis:</b><pre>\n${randomHadith.content}</pre>` : ''),
          {
            reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
            parse_mode: 'HTML',
          },
        )
      } catch (error) {
        await handleSendMessageError(error, user)
      }
    }
  }
}

async function reminder(bot: Bot<BotContext>) {
  await schedule.gracefulShutdown()

  const now = new Date()
  const currentDay = now.getDate()
  const regions = await Model.PrayTime.find<IPrayTime>({ day: currentDay })

  for (let region of regions) {
    // times
    const fajr = region.fajr.split(':')
    const sunrise = region.sunrise.split(':')
    const dhuhr = region.dhuhr.split(':')
    const asr = region.asr.split(':')
    const maghrib = region.maghrib.split(':')
    const isha = region.isha.split(':')

    // schedule
    schedule.scheduleJob({ hour: fajr[0], minute: fajr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId: region.regionId,
        notification: true,
        deletedAt: null,
        status: true,
        $or: [{ 'notificationSetting.fajr': true }, { fasting: true }],
      })

      for (const user of users) {
        try {
          let message: string

          if (user.fasting) {
            message = HLanguage('closeFast')
            message += `\n\nنَوَيْتُ أَنْ أَصُومَ صَوْمَ شَهْرَ رَمَضَانَ مِنَ الْفَجْرِ إِلَى الْمَغْرِبِ، خَالِصًا لِلهِ تَعَالَى أَللهُ أَكْبَرُ\n\nНавайту ан асувма совма шаҳри рамазона минал фажри илал мағриби, холисан лиллаҳи таъаалаа Аллоҳу акбар`
          } else {
            message = HLanguage('fajrTime')
          }

          await bot.api.sendMessage(user.userId, message)
        } catch (error: any) {
          await handleSendMessageError(error, user)
        }
      }
    })

    schedule.scheduleJob({ hour: sunrise[0], minute: sunrise[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': region.regionId,
        'notification': true,
        'deletedAt': null,
        'status': true,
        'notificationSetting.sunrise': true,
      })

      for (const user of users) {
        try {
          const sunriseTime = HLanguage('sunriseTime')

          await bot.api.sendMessage(user.userId, sunriseTime)
        } catch (error: any) {
          await handleSendMessageError(error, user)
        }
      }
    })

    schedule.scheduleJob({ hour: dhuhr[0], minute: dhuhr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': region.regionId,
        'notification': true,
        'deletedAt': null,
        'status': true,
        'notificationSetting.dhuhr': true,
      })
      for (const user of users) {
        try {
          const dhuhrTime = HLanguage('dhuhrTime')

          await bot.api.sendMessage(user.userId, dhuhrTime)
        } catch (error) {
          await handleSendMessageError(error, user)
        }
      }
    })

    schedule.scheduleJob({ hour: asr[0], minute: asr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': region.regionId,
        'notification': true,
        'deletedAt': null,
        'status': true,
        'notificationSetting.asr': true,
      })

      for (const user of users) {
        try {
          const asrTime = HLanguage('asrTime')

          await bot.api.sendMessage(user.userId, asrTime)
        } catch (error) {
          await handleSendMessageError(error, user)
        }
      }
    })

    schedule.scheduleJob({ hour: maghrib[0], minute: maghrib[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId: region.regionId,
        notification: true,
        deletedAt: null,
        status: true,
        $or: [{ 'notificationSetting.maghrib': true }, { fasting: true }],
      })

      for (const user of users) {
        try {
          let message

          if (user.fasting) {
            message = HLanguage('breakFast')
            message += `\n\nاَللَّهُمَّ لَكَ صُمْتُ وَ بِكَ آمَنْتُ وَ عَلَيْكَ تَوَكَّلْتُ وَ عَلَى رِزْقِكَ أَفْتَرْتُ، فَغْفِرْلِى مَا قَدَّمْتُ وَ مَا أَخَّرْتُ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ\n\nАллоҳумма лака сумту ва бика ааманту ва аълайка таваккалту ва аълаа ризқика афтарту, фағфирлий ма қоддамту ва маа аххорту бироҳматика йаа арҳамар рооҳимийн`
          } else {
            message = HLanguage('maghribTime')
          }

          await bot.api.sendMessage(user.userId, message)
        } catch (error) {
          await handleSendMessageError(error, user)
        }
      }
    })

    schedule.scheduleJob({ hour: isha[0], minute: isha[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': region.regionId,
        'notification': true,
        'deletedAt': null,
        'status': true,
        'notificationSetting.isha': true,
      })

      for (const user of users) {
        try {
          const ishaTime = HLanguage('ishaTime')

          await bot.api.sendMessage(user.userId, ishaTime)
        } catch (error) {
          await handleSendMessageError(error, user)
        }
      }
    })
  }
}

async function weekly(bot: Bot<BotContext>) {
  const users = await Model.User.find<IUser>({
    status: true,
    deletedAt: null,
  })

  for (const user of users) {
    try {
      const message = HLanguage('shareBot')
      const keyboard = new InlineKeyboard()
      const enterMessage = HLanguage('enter')
      keyboard.url(enterMessage, 'https://t.me/' + bot.botInfo.username)

      await bot.api.sendMessage(user.userId, message, { reply_markup: keyboard })
    } catch (error) {
      await handleSendMessageError(error, user)
    }
  }
}

export async function cronStarter(bot: Bot<BotContext>) {
  const scheduleOptions = {
    timezone: 'Asia/Tashkent',
  }

  cron.schedule(
    '30 0 1 * *',
    async () => {
      await monthly()
    },
    scheduleOptions,
  )

  cron.schedule(
    '0 1 * * *',
    async () => {
      await daily(bot)
      await reminder(bot)
    },
    scheduleOptions,
  )

  cron.schedule(
    '0 13 * * 1',
    async () => {
      await weekly(bot)
    },
    scheduleOptions,
  )

  await reminder(bot)
}
