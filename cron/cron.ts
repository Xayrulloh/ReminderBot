import { resolve } from 'path'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import schedule from 'node-schedule'
import customKFunction from '#keyboard/custom'
import { Bot, InlineKeyboard, InputFile } from 'grammy'
import { BotContext } from '#types/context'
import { IUser, IGroup } from '#types/database'
import cron from 'node-cron'
import { handleGroupSendMessageError, handleUserSendMessageError } from '#helper/errorHandler'
import { getQuranVerse } from '#helper/getQuranVerse'
import dayjs from '#utils/dayjs'
import { cwd } from 'process'
import { getPrayerTimes, initRegions } from '#utils/prayerTimes'

async function daily(bot: Bot<BotContext>) {
  const now = dayjs()
  const weekDay = now.get('day')
  const file = new InputFile(resolve(cwd(), 'dist', 'public', 'JumaMuborak.jpg'))
  const verse = (await getQuranVerse()).trim()

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
      const info = user.fasting ? HLanguage('infoPrayTimeFasting') : HLanguage('infoPrayTime')
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
          now.format('DD/MM/YYYY'),
        ],
      )

      const keyboardText = HLanguage('mainKeyboard')
      const buttons = customKFunction(2, ...keyboardText)

      if (weekDay == 5) {
        await bot.api
          .sendPhoto(user.userId, file, {
            caption: `\n\n${message} ${verse ? `\n\n<b>Kunlik oyat: </b>${verse}` : ''}`,
            parse_mode: 'HTML',
          })
          .catch(async (e) => await handleUserSendMessageError(e, user))
      } else {
        await bot.api
          .sendMessage(user.userId, message + (verse ? `\n\n<b>Kunlik oyat: </b>${verse}` : ''), {
            reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
            parse_mode: 'HTML',
          })
          .catch(async (e) => await handleUserSendMessageError(e, user))
      }
    }

    const groups = await Model.Group.find<IGroup>({
      regionId: region.regionId,
      status: true,
    })

    for (let group of groups) {
      let message = HReplace(
        HLanguage('infoPrayTime'),
        ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha', '$date'],
        [
          region.region,
          region.fajr,
          region.sunrise,
          region.dhuhr,
          region.asr,
          region.maghrib,
          region.isha,
          now.format('DD/MM/YYYY'),
        ],
      )

      if (weekDay == 5) {
        await bot.api
          .sendPhoto(group.groupId, file, {
            caption: `\n\n${message} ${verse ? `\n\n<b>Kunlik oyat: </b>${verse}` : ''}`,
            parse_mode: 'HTML',
          })
          .catch(async (e) => {
            await handleGroupSendMessageError(e, group)
          })
      } else {
        await bot.api
          .sendMessage(group.groupId, message + (verse ? `\n\n<b>Kunlik oyat: </b>${verse}` : ''), {
            parse_mode: 'HTML',
          })
          .catch(async (e) => {
            await handleGroupSendMessageError(e, group)
          })
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
        await bot.api
          .sendMessage(user.userId, user.fasting ? HLanguage('closeFast') : HLanguage('fajrTime'))
          .catch(async (err: any) => {
            await handleUserSendMessageError(err, user)
          })
      }
    })

    schedule.scheduleJob({ hour: +sunrise[0], minute: +sunrise[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        deletedAt: null,
        status: true,
        'notificationSetting.sunrise': true,
      })

      for (const user of users) {
        await bot.api
          .sendMessage(user.userId, user.fasting ? HLanguage('sunriseFastingTime') : HLanguage('sunriseTime'))
          .catch(async (err: any) => await handleUserSendMessageError(err, user))
      }
    })

    schedule.scheduleJob({ hour: +dhuhr[0], minute: +dhuhr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        deletedAt: null,
        status: true,
        'notificationSetting.dhuhr': true,
      })

      for (const user of users) {
        await bot.api.sendMessage(user.userId, HLanguage('dhuhrTime')).catch(async (err: any) => {
          await handleUserSendMessageError(err, user)
        })
      }
    })

    schedule.scheduleJob({ hour: +asr[0], minute: +asr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        deletedAt: null,
        status: true,
        'notificationSetting.asr': true,
      })

      for (const user of users) {
        await bot.api.sendMessage(user.userId, HLanguage('asrTime')).catch(async (err: any) => {
          await handleUserSendMessageError(err, user)
        })
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
        await bot.api
          .sendMessage(user.userId, user.fasting ? HLanguage('breakFast') : HLanguage('maghribTime'))
          .catch(async (err: any) => {
            await handleUserSendMessageError(err, user)
          })
      }
    })

    schedule.scheduleJob({ hour: +isha[0], minute: +isha[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        deletedAt: null,
        status: true,
        'notificationSetting.isha': true,
      })

      for (const user of users) {
        await bot.api.sendMessage(user.userId, HLanguage('ishaTime')).catch(async (err: any) => {
          await handleUserSendMessageError(err, user)
        })
      }
    })
  }
}

async function weekly(bot: Bot<BotContext>) {
  const users = await Model.User.find<IUser>({
    status: true,
    deletedAt: null,
  })

  const message = HLanguage('shareBot')
  const keyboard = new InlineKeyboard()
  const enterMessage = HLanguage('enter')
  const addToGroupMessage = HLanguage('addToGroup')

  keyboard.url(enterMessage, 'https://t.me/' + bot.botInfo.username)
  keyboard.row()
  keyboard.url(addToGroupMessage, 'https://t.me/' + bot.botInfo.username + '?startgroup=' + bot.botInfo.username)

  for (const user of users) {
    await bot.api
      .sendMessage(user.userId, message, { reply_markup: keyboard })
      .catch(async (e) => await handleUserSendMessageError(e, user))
  }

  const groups = await Model.Group.find<IGroup>({
    status: true,
  })

  for (const group of groups) {
    await bot.api.sendMessage(group.groupId, message, { reply_markup: keyboard }).catch(async (e) => {
      await handleGroupSendMessageError(e, group)
    })
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
  await getQuranVerse()
}
