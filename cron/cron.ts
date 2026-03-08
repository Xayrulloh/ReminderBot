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
import { type PrayerTimesResult, getPrayerTimes, getRegionIds } from '#utils/prayerTimes'

const ACTIVE_USER_FILTER = { deletedAt: null, status: true }

type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

const PRAYER_NOTIFICATIONS: { name: PrayerName; getMessage: (user: IUser) => string }[] = [
  { name: 'fajr', getMessage: (user) => (user.fasting ? t(($) => $.closeFast) : t(($) => $.fajrTime)) },
  { name: 'sunrise', getMessage: (user) => (user.fasting ? t(($) => $.sunriseFastingTime) : t(($) => $.sunriseTime)) },
  { name: 'dhuhr', getMessage: () => t(($) => $.dhuhrTime) },
  { name: 'asr', getMessage: () => t(($) => $.asrTime) },
  { name: 'maghrib', getMessage: (user) => (user.fasting ? t(($) => $.breakFast) : t(($) => $.maghribTime)) },
  { name: 'isha', getMessage: () => t(($) => $.ishaTime) },
]

function buildPrayerOpts(region: PrayerTimesResult, date: string) {
  return {
    region: region.region,
    fajr: region.fajr,
    sunrise: region.sunrise,
    dhuhr: region.dhuhr,
    asr: region.asr,
    maghrib: region.maghrib,
    isha: region.isha,
    date,
  }
}

function appendVerse(message: string, verse: string) {
  return verse ? `${message}\n\n<b>Kunlik oyat: </b>${verse}` : message
}

/** Sends the morning prayer timetable to every active user and group.
 *  On Fridays a "Juma Muborak" photo is sent instead of a plain text message.
 *  A daily Quran verse is appended when available. */
async function daily(bot: Bot<BotContext>) {
  const now = dayjs()
  const isFriday = now.get('day') === 5
  const file = new InputFile(resolve(cwd(), 'dist', 'public', 'JumaMuborak.jpg'))
  const verse = (await getQuranVerse()).trim()
  const date = now.format('DD/MM/YYYY')

  const keyboardText = t(($) => $.mainKeyboard, { returnObjects: true })
  const buttons = customKFunction(2, ...keyboardText)

  const [userRegionIds, groupRegionIds] = await Promise.all([
    Model.User.distinct('regionId', ACTIVE_USER_FILTER),
    Model.Group.distinct('regionId', { status: true }),
  ])
  const activeRegionIds: number[] = [...new Set([...userRegionIds, ...groupRegionIds])]

  for (const regionId of activeRegionIds) {
    const region = getPrayerTimes(regionId, now.toDate())
    if (!region) continue

    const prayerOpts = buildPrayerOpts(region, date)

    const users = await Model.User.find<IUser>({ regionId, ...ACTIVE_USER_FILTER })

    for (const user of users) {
      const message = user.fasting ? t(($) => $.infoPrayTimeFasting, prayerOpts) : t(($) => $.infoPrayTime, prayerOpts)
      const fullMessage = appendVerse(message, verse)

      if (isFriday) {
        await bot.api
          .sendPhoto(user.userId, file, { caption: `\n\n${fullMessage}`, parse_mode: 'HTML' })
          .catch(async (e) => await handleUserSendMessageError(e, user))
      } else {
        await bot.api
          .sendMessage(user.userId, fullMessage, {
            reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
            parse_mode: 'HTML',
          })
          .catch(async (e) => await handleUserSendMessageError(e, user))
      }
    }

    const groups = await Model.Group.find<IGroup>({ regionId: region.regionId, status: true })
    const groupMessage = appendVerse(
      t(($) => $.infoPrayTime, prayerOpts),
      verse,
    )

    for (const group of groups) {
      if (isFriday) {
        await bot.api
          .sendPhoto(group.groupId, file, { caption: `\n\n${groupMessage}`, parse_mode: 'HTML' })
          .catch(async (e) => await handleGroupSendMessageError(e, group))
      } else {
        await bot.api
          .sendMessage(group.groupId, groupMessage, { parse_mode: 'HTML' })
          .catch(async (e) => await handleGroupSendMessageError(e, group))
      }
    }
  }
}

/** Cancels all existing scheduled jobs and re-creates per-prayer-time alerts
 *  for every region. Each alert fires at the exact prayer time and notifies
 *  users who have that specific notification enabled (e.g. notificationSetting.fajr). */
async function reminder(bot: Bot<BotContext>) {
  await schedule.gracefulShutdown()

  const now = dayjs()
  const allRegionIds = getRegionIds()

  for (const regionId of allRegionIds) {
    const region = getPrayerTimes(regionId, now.toDate())
    if (!region) continue

    for (const { name, getMessage } of PRAYER_NOTIFICATIONS) {
      const [hour, minute] = region[name].split(':').map(Number)

      schedule.scheduleJob({ hour, minute, tz: 'Asia/Tashkent' }, async () => {
        const users = await Model.User.find<IUser>({
          regionId,
          ...ACTIVE_USER_FILTER,
          [`notificationSetting.${name}`]: true,
        })

        for (const user of users) {
          await bot.api
            .sendMessage(user.userId, getMessage(user))
            .catch(async (err) => await handleUserSendMessageError(err, user))
        }
      })
    }
  }
}

/** Entry point: schedules the daily 01:00 cron job and runs the first
 *  reminder cycle immediately so prayer alerts are active right after startup. */
export async function cronStarter(bot: Bot<BotContext>) {
  cron.schedule(
    '0 1 * * *',
    async () => {
      await daily(bot)
      await reminder(bot)
    },
    { timezone: 'Asia/Tashkent' },
  )

  await reminder(bot)
  await getQuranVerse()
}
