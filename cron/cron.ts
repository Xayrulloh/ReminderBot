import { resolve } from 'path'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import schedule from 'node-schedule'
import customKFunction from '#keyboard/custom'
import { Bot, InlineKeyboard, InputFile } from 'grammy'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'
import cron from 'node-cron'
import { handleSendMessageError } from '#helper/errorHandler'
import { getHadith } from '#helper/getHadith'
import dayjs from '#utils/dayjs'
import { cwd } from 'process'
import { getPrayerTimes, initRegions } from '#utils/prayerTimes'

async function daily(bot: Bot<BotContext>) {
  const now = dayjs()
  const weekDay = now.get("day")
  const file = new InputFile(resolve(cwd(), 'dist', 'public', 'JumaMuborak.jpg'))
  const hadith = (await getHadith()).replace('\n\n', '');

  const activeRegionIds: number[] = await Model.User.distinct('regionId', { deletedAt: null, status: true })

  for (let regionId of activeRegionIds) {
    const region = getPrayerTimes(regionId, now.toDate())
    if (!region) continue

    const users = await Model.User.find<IUser>({
      regionId,
      deletedAt: null,
      status: true,
    })

    for (let user of users) {
      const info = HLanguage('infoPrayTime')
      let message = HReplace(
        info,
        ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha', '$date'],
        [
          region.region,
          region.fajr,
          region.sunrise,
          region.dhuhr,
          region.asr,
          region.maghrib,
          region.isha,
          now.format("DD/MM/YYYY"),
        ],
      )

      const keyboardText = HLanguage('mainKeyboard')
      const buttons = customKFunction(2, ...keyboardText)

      try {
        if (weekDay == 5) {
          await bot.api.sendPhoto(user.userId, file, {
            caption: `\n\n${message}\n\n<b>Kunlik hadis:</b>${hadith}`,
            parse_mode: 'HTML',
          })
        } else {
          await bot.api.sendMessage(user.userId, message + (hadith ? `\n\n<b>Kunlik hadis:</b>${hadith}` : ''), {
            reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
            parse_mode: 'HTML',
          })
        }
      } catch (error) {
        await handleSendMessageError(error, user)
      }
    }
  }
}

async function reminder(bot: Bot<BotContext>) {
  await schedule.gracefulShutdown()

  const now = dayjs()
  const activeRegionIds: number[] = await Model.User.distinct('regionId', { deletedAt: null, status: true })

  for (let regionId of activeRegionIds) {
    const region = getPrayerTimes(regionId, now.toDate())
    if (!region) continue

    // times
    const fajr = region.fajr.split(':')
    const sunrise = region.sunrise.split(':')
    const dhuhr = region.dhuhr.split(':')
    const asr = region.asr.split(':')
    const maghrib = region.maghrib.split(':')
    const isha = region.isha.split(':')

    // schedule
    schedule.scheduleJob({ hour: +fajr[0], minute: +fajr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        deletedAt: null,
        status: true,
        'notificationSetting.fajr': true,
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

    schedule.scheduleJob({ hour: +sunrise[0], minute: +sunrise[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': regionId,
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

    schedule.scheduleJob({ hour: +dhuhr[0], minute: +dhuhr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': regionId,
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

    schedule.scheduleJob({ hour: +asr[0], minute: +asr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': regionId,
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

    schedule.scheduleJob({ hour: +maghrib[0], minute: +maghrib[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        deletedAt: null,
        status: true,
        'notificationSetting.maghrib': true,
      })

      for (const user of users) {
        try {
          let message

          if (user.fasting) {
            message = HLanguage('breakFast')
            message += `\n\nاَللَّهُمَّ لَكَ صُمْتُ وَ بِكَ آمَنْتُ وَ عَلَيْكَ تَوَكَّلْتُ وَ عَلَى رِزْقِكَ أَفْتَرْتُ، فَغْفِرْلِى مَا قَدَّمْتُ وَ مَا أَخَّرْتُ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ\n\nАллоҳумма лака сумту ва бика ааманту ва аълайка таваккалту ва аълаа ризқика афтарту, фағфирлий ма қоддамту ва маа аххорту бироҳматика йаа арҳамар рооҳимийн`
          } else {
            message = HLanguage('maghribTime')
          }

          await bot.api.sendMessage(user.userId, message)
        } catch (error) {
          await handleSendMessageError(error, user)
        }
      }
    })

    schedule.scheduleJob({ hour: +isha[0], minute: +isha[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        'regionId': regionId,
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
  await initRegions()

  const scheduleOptions = {
    timezone: 'Asia/Tashkent',
  }

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
  await getHadith()
}
