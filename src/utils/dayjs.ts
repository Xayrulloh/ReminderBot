import utc from 'dayjs/plugin/utc.js'
import timezone from "dayjs/plugin/timezone.js";
import dayjs from "dayjs";
import { TZ } from "#utils/constants.ts";

dayjs.extend(utc)
dayjs.extend(timezone);
dayjs.tz.setDefault(TZ);

export default dayjs.tz;
