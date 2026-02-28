/**
 * One-time seed script: fetches all Quran verse translations in Uzbek (Cyrillic)
 * + Arabic (Uthmani) from api.quran.com and inserts them into MongoDB.
 *
 * Run after build:
 *   node --env-file=.env -r tsconfig-paths/register dist/mock/seedQuran.js
 */

import '#config/database'
import axios from 'axios'
import mongoose from 'mongoose'
import Model from '#config/database'

const TRANSLATION_ID = 101 // Uzbek Cyrillic — Alauddin Mansour
const BASE_URL = 'https://api.quran.com/api/v4'

// Strip HTML tags like <sup foot_note=123>1</sup>
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

// Verse counts per surah (114 surahs in order)
const VERSES_PER_SURAH = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
  78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
  37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52,
  52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

export async function seed() {
  console.log('Seeding Quran...')
  // Build surah:ayah lookup indexed by global order (0-based)
  const verseMap: { surah: number; ayah: number }[] = []
  for (let surah = 1; surah <= 114; surah++) {
    const count = VERSES_PER_SURAH[surah - 1]
    for (let ayah = 1; ayah <= count; ayah++) {
      verseMap.push({ surah, ayah })
    }
  }
  console.log(`Verse map built: ${verseMap.length} verses`)

  // Fetch Uzbek translations (all 6236 in one response)
  console.log('Fetching Uzbek translations...')
  const transRes = await axios.get(`${BASE_URL}/quran/translations/${TRANSLATION_ID}`)
  const translations: { text: string }[] = transRes.data.translations ?? []
  console.log(`Received ${translations.length} Uzbek translations`)

  // Fetch Arabic text (Uthmani script, all verses)
  console.log('Fetching Arabic (Uthmani) text...')
  const arabicRes = await axios.get(`${BASE_URL}/quran/verses/uthmani`)
  const arabicVerses: { text_uthmani: string }[] = arabicRes.data.verses ?? []
  console.log(`Received ${arabicVerses.length} Arabic verses`)

  const count = Math.min(translations.length, arabicVerses.length, verseMap.length)

  const verses = Array.from({ length: count }, (_, i) => ({
    surah: verseMap[i].surah,
    ayah: verseMap[i].ayah,
    origin: arabicVerses[i].text_uthmani,
    uzbek: stripHtml(translations[i].text),
  }))

  console.log(`Inserting ${verses.length} verses into MongoDB...`)
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await Model.Quran.deleteMany({}, { session })
      await Model.Quran.insertMany(verses, { session })
    })
  } finally {
    await session.endSession()
  }

  console.log('Done! Quran collection seeded successfully.')
  await mongoose.disconnect()
}