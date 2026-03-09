import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan'
import regions from '#config/regions.json'
import dayjs from './dayjs'
import { ConfigType as DayJsInput } from 'dayjs'

export interface PrayerTimesResult {
  region: string
  regionId: number
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

export function getRegionIds(): Set<number> {
  return new Set(regions.map((r) => r.id))
}

function formatTime(date: Date): string {
  return dayjs(date).format('HH:mm')
}

/** Computes prayer times for a region using the adhan library.
 *  Uses custom fajr/isha angles (15.5°) matching islom.uz and Hanafi madhab. */
export function getPrayerTimes(regionId: number, date: DayJsInput): PrayerTimesResult | null {
  const region = regions.find((r) => r.id === regionId)

  if (!region) return null

  const coordinates = new Coordinates(region.latitude, region.longitude)
  const params = CalculationMethod.Other()
  params.fajrAngle = 15.5
  params.ishaAngle = 15.5
  params.madhab = Madhab.Hanafi

  // adhan extracts date via getFullYear/getMonth/getDate (server-local timezone).
  // When the server runs in UTC, 01:00 Tashkent = 20:00 UTC (previous day),
  // so adhan would calculate yesterday's prayer times. Fix by converting to UTC
  // while keeping local time.
  const correctedDate = dayjs(date).utc(true).toDate()
  const prayerTimes = new PrayerTimes(coordinates, correctedDate, params)

  return {
    region: region.name,
    regionId: region.id,
    fajr: formatTime(prayerTimes.fajr),
    sunrise: formatTime(prayerTimes.sunrise),
    dhuhr: formatTime(prayerTimes.dhuhr),
    asr: formatTime(prayerTimes.asr),
    // +4 min ihtiyat (precautionary buffer) — adhan computes astronomical sunset,
    // but Hanafi practice requires the full solar disk to disappear below the horizon
    maghrib: formatTime(new Date(prayerTimes.maghrib.getTime() + 4 * 60_000)),
    isha: formatTime(prayerTimes.isha),
  }
}
