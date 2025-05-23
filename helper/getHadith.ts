import Model from '#config/database'
import { memoryStorage } from '#config/storage'
import { IHadith } from '#types/database'
import { DAILY_HADITH_KEY } from '#utils/constants'
import dayjs from '#utils/dayjs'
import { blockQuote } from './html'

export async function getHadith(): Promise<string> {
  // taking hadith
  const now = dayjs()
  const weekDay = now.get('day')
  let hadith: IHadith[] | string

  if (weekDay == 5) {
    hadith = await Model.Hadith.aggregate<IHadith>([{ $match: { category: 'juma' } }, { $sample: { size: 1 } }])
  } else {
    hadith = await Model.Hadith.aggregate<IHadith>([
      { $match: { category: { $ne: 'juma' } } },
      { $sample: { size: 1 } },
    ])
  }

  hadith = '\n\n' + blockQuote(hadith[0]?.content)

  // Set daily hadith to storage
  memoryStorage.write(DAILY_HADITH_KEY, hadith)

  return hadith
}
