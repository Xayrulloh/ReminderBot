import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import dayjs from 'dayjs'
import { TZ } from '#utils/constants'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault(TZ)

export default dayjs.tz
