import { Times, dailyReminder } from "./secheduler.js";

export default async function heart() {
  let remainingTime = 86400000 - (new Date().getHours() * 60 * 60 + new Date().getMinutes() * 60 + new Date().getSeconds()) * 1000;

  Times();

  if (remainingTime != 0) {
    let interval1 = setInterval(async () => {
      setInterval(async () => {
        await dailyReminder();
        await Times();
      }, 86400000);

      await dailyReminder();
      await Times();

      clearInterval(interval1);
    }, remainingTime);
  } else {
    setInterval(async () => {
      await dailyReminder();
      await Times();
    }, 86400000);

    await dailyReminder();
    await Times();
  }
}
