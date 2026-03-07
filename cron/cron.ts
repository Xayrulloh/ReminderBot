import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { type Bot, InputFile } from 'grammy'
import cron from 'node-cron'
import schedule from 'node-schedule'
import Model from '#config/database'
import { t } from '#config/i18n'
import { handleGroupSendMessageError, handleUserSendMessageError } from '#helper/errorHandler'
import { getQuranVerse } from '#helper/getQuranVerse'
import customKFunction from '#keyboard/custom'
import type { BotContext } from '#types/context'
import type { IGroup, IUser } from '#types/database'
import dayjs from '#utils/dayjs'
import { getPrayerTimes, initRegions } from '#utils/prayerTimes'

async function daily(bot: Bot<BotContext>) {
  const now = dayjs()
  const weekDay = now.get('day')
  const file = new InputFile(resolve(cwd(), 'dist', 'public', 'JumaMuborak.jpg'))
  const verse = (await getQuranVerse()).trim()

  const activeRegionIds: number[] = await Model.User.distinct('regionId', {
    deletedAt: null,
    status: true,
  })

  for (const regionId of activeRegionIds) {
    const region = getPrayerTimes(regionId, now.toDate())
    if (!region) continue

    const users = await Model.User.find<IUser>({
      regionId,
      deletedAt: null,
      status: true,
    })

    for (const user of users) {
      const prayerOpts = {
        region: region.region,
        fajr: region.fajr,
        sunrise: region.sunrise,
        zuhr: region.dhuhr,
        asr: region.asr,
        maghrib: region.maghrib,
        isha: region.isha,
        date: now.format('DD/MM/YYYY'),
      }
      const message = user.fasting ? t(($) => $.infoPrayTimeFasting, prayerOpts) : t(($) => $.infoPrayTime, prayerOpts)

      const keyboardText = t(($) => $.mainKeyboard, { returnObjects: true })
      const buttons = customKFunction(2, ...keyboardText)

      if (weekDay === 5) {
        await bot.api
          .sendPhoto(user.userId, file, {
            caption: `\n\n${message} ${verse ? `\n\n<b>Kunlik oyat: </b>${verse}` : ''}`,
            parse_mode: 'HTML',
          })
          .catch(async (e) => await handleUserSendMessageError(e, user))
      } else {
        await bot.api
          .sendMessage(user.userId, message + (verse ? `\n\n<b>Kunlik oyat: </b>${verse}` : ''), {
            reply_markup: {
              keyboard: buttons.build(),
              resize_keyboard: true,
            },
            parse_mode: 'HTML',
          })
          .catch(async (e) => await handleUserSendMessageError(e, user))
      }
    }

    const groups = await Model.Group.find<IGroup>({
      regionId: region.regionId,
      status: true,
    })

    for (const group of groups) {
      const message = t(($) => $.infoPrayTime, {
        region: region.region,
        fajr: region.fajr,
        sunrise: region.sunrise,
        zuhr: region.dhuhr,
        asr: region.asr,
        maghrib: region.maghrib,
        isha: region.isha,
        date: now.format('DD/MM/YYYY'),
      })

      if (weekDay === 5) {
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
  const activeRegionIds: number[] = await Model.User.distinct('regionId', {
    deletedAt: null,
    status: true,
  })

  for (const regionId of activeRegionIds) {
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
        'deletedAt': null,
        'status': true,
        'notificationSetting.fajr': true,
      })

      for (const user of users) {
        await bot.api
          .sendMessage(user.userId, user.fasting ? t(($) => $.closeFast) : t(($) => $.fajrTime))
          .catch(async (err) => {
            await handleUserSendMessageError(err, user)
          })
      }
    })

    schedule.scheduleJob({ hour: +sunrise[0], minute: +sunrise[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        'deletedAt': null,
        'status': true,
        'notificationSetting.sunrise': true,
      })

      for (const user of users) {
        await bot.api
          .sendMessage(user.userId, user.fasting ? t(($) => $.sunriseFastingTime) : t(($) => $.sunriseTime))
          .catch(async (err) => await handleUserSendMessageError(err, user))
      }
    })

    schedule.scheduleJob({ hour: +dhuhr[0], minute: +dhuhr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        'deletedAt': null,
        'status': true,
        'notificationSetting.dhuhr': true,
      })

      for (const user of users) {
        await bot.api
          .sendMessage(
            user.userId,
            t(($) => $.dhuhrTime),
          )
          .catch(async (err) => {
            await handleUserSendMessageError(err, user)
          })
      }
    })

    schedule.scheduleJob({ hour: +asr[0], minute: +asr[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        'deletedAt': null,
        'status': true,
        'notificationSetting.asr': true,
      })

      for (const user of users) {
        await bot.api
          .sendMessage(
            user.userId,
            t(($) => $.asrTime),
          )
          .catch(async (err) => {
            await handleUserSendMessageError(err, user)
          })
      }
    })

    schedule.scheduleJob({ hour: +maghrib[0], minute: +maghrib[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        'deletedAt': null,
        'status': true,
        'notificationSetting.maghrib': true,
      })

      for (const user of users) {
        await bot.api
          .sendMessage(user.userId, user.fasting ? t(($) => $.breakFast) : t(($) => $.maghribTime))
          .catch(async (err) => {
            await handleUserSendMessageError(err, user)
          })
      }
    })

    schedule.scheduleJob({ hour: +isha[0], minute: +isha[1], tz: 'Asia/Tashkent' }, async () => {
      const users = await Model.User.find<IUser>({
        regionId,
        'deletedAt': null,
        'status': true,
        'notificationSetting.isha': true,
      })

      for (const user of users) {
        await bot.api
          .sendMessage(
            user.userId,
            t(($) => $.ishaTime),
          )
          .catch(async (err) => {
            await handleUserSendMessageError(err, user)
          })
      }
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

  await reminder(bot)
  await getQuranVerse()
}
