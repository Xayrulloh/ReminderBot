import { ScenesComposer } from 'grammy-scenes'
import start from './start.js'
import location from './location.js'
import search from './search.js'
import notification from './notification.js'
import fasting from './fasting.js'
import statistic from './statistic.js'
import advertise from './advertise.js'
import language from './language.js'
import donate from './donate.js'

export const scenes = new ScenesComposer(
  language,
  notification,
  search,
  advertise,
  statistic,
  location,
  fasting,
  start,
  donate,
)
