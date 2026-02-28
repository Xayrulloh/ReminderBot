import Model from '#config/database'
import { memoryStorage } from '#config/storage'
import { IQuran } from '#types/database'
import { DAILY_QURAN_KEY } from '#utils/constants'
import { blockQuote } from './html'

export async function getQuranVerse(): Promise<string> {
  let text = ''

  try {
    const verses = await Model.Quran.aggregate<IQuran>([{ $sample: { size: 1 } }])
    const verse = verses[0]

    if (verse) {
      const header = `(<b>${verse.surah}:${verse.ayah}</b>)`
      const arabic = blockQuote(verse.origin)
      const translation = blockQuote(verse.uzbek)

      text = `\n\n${header}\n${arabic}${translation}`
      memoryStorage.write(DAILY_QURAN_KEY, text)
    }
  } catch (error) {
    console.error('Failed to fetch Quran verse:', error)
  }

  return text
}
}
