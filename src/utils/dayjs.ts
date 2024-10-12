import timezone from "dayjs/plugin/timezone.js";
import dayjs from "dayjs";
import { TZ } from "#utils/constants.ts";

dayjs.extend(timezone);
// deno-lint-ignore ban-ts-comment
// @ts-ignore
dayjs.tz.setDefault(TZ);

export default dayjs;
