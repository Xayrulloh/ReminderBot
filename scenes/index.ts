import { ScenesComposer } from 'grammy-scenes'
import start from './start'
import location from './location'
import search from './search'
import notification from './notification'
import fasting from './fasting'
import statistic from './statistic'
import announcement from './announcement'
import language from './language'
import donate from './donate'
import hadith from './hadith'
import { BotContext } from '#types/context'

export const scenes = new ScenesComposer<BotContext>(
  language,
  notification,
  search,
  announcement,
  statistic,
  location,
  fasting,
  start,
  donate,
  hadith,
)
