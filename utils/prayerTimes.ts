import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan'
import axios from 'axios'
import fallbackRegions from '#config/regions.json'
import dayjs from '#utils/dayjs'

interface Region {
  id: number
  name: string
  latitude: number
  longitude: number
}

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

let regions: Region[] = []

export async function initRegions(): Promise<void> {
  try {
    const { data } = await axios.get<{ id: number; name: string; latitude: string; longitude: string }[]>(
      'https://new.islom.uz/api/v1/regions',
      { timeout: 5000 },
    )
    regions = data
      .map((r) => ({
        id: r.id,
        name: r.name,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
      }))
      .filter((r) => !Number.isNaN(r.latitude) && !Number.isNaN(r.longitude))
    console.info(`Loaded ${regions.length} regions from API`)
  } catch (_error) {
    console.warn('Failed to fetch regions from API, using static fallback')
    regions = fallbackRegions
  }
}

export function getRegionIds(): number[] {
  return regions.map((r) => r.id)
}

function formatTime(date: Date): string {
  return dayjs(date).format('HH:mm')
}

export function getPrayerTimes(regionId: number, date: Date): PrayerTimesResult | null {
  const region = regions.find((r) => r.id === regionId)
  if (!region) return null

  const coordinates = new Coordinates(region.latitude, region.longitude)
  const params = CalculationMethod.MuslimWorldLeague()
  params.madhab = Madhab.Hanafi

  const prayerTimes = new PrayerTimes(coordinates, date, params)

  return {
    region: region.name,
    regionId: region.id,
    fajr: formatTime(prayerTimes.fajr),
    sunrise: formatTime(prayerTimes.sunrise),
    dhuhr: formatTime(prayerTimes.dhuhr),
    asr: formatTime(prayerTimes.asr),
    maghrib: formatTime(prayerTimes.maghrib),
    isha: formatTime(prayerTimes.isha),
  }
}
