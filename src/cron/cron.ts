import { resolve } from "@std/path";
import axios from "axios";
import pdfParser from "pdf-parse";
import Model from "#config/database.ts";
import HLanguage from "#helper/language.ts";
import { HReplace } from "#helper/replacer.ts";
import customKFunction from "#keyboard/custom.ts";
import { Bot, InlineKeyboard, InputFile } from "grammy";
import { BotContext } from "#types/context.ts";
import { IPrayTime, IUser } from "#types/database.ts";
import { env } from "#utils/env.ts";
import { handleSendMessageError } from "#helper/errorHandler.ts";
import { getHadith } from "#helper/getHadith.ts";
import dayjs from "#utils/dayjs.ts";

async function yearly() {
  const keyboardMessage = HLanguage("region");
  const regions = Object.keys(keyboardMessage);
  const regionIds = Object.values(keyboardMessage);
  const daysOfWeek = [
    "Якшанба",
    "Душанба",
    "Сешанба",
    "Чоршанба",
    "Пайшанба",
    "Жума",
    "Шанба",
  ];
  const prayTimes = [];

  await Model.PrayTime.deleteMany();

  for (let month = 1; month <= 12; month++) {
    for (let region = 0; region < regions.length; region++) {
      const pdf = await axios.get(
        env.TIME_API + regionIds[region] + "/" + month,
        {
          responseType: "arraybuffer",
        },
      );
      const pdfData = await pdfParser(pdf.data);
      const data = pdfData.text.split("\n");

      for (const el of data) {
        if (el.length > 20 && el.split(" ").length == 1) {
          for (const day of daysOfWeek) {
            if (el.includes(day)) {
              const dayNumber = el.split(day)[0];
              const times = el.split(day)[1].match(
                /.{1,5}/g,
              ) as RegExpMatchArray;

              prayTimes.push({
                region: regions[region],
                regionId: regionIds[region],
                day: dayNumber,
                fajr: times[0],
                sunrise: times[1],
                dhuhr: times[2],
                asr: times[3],
                maghrib: times[4],
                isha: times[5],
                month,
              });
            }
          }
        }
      }
    }
  }

  await Model.PrayTime.insertMany<IPrayTime>(prayTimes);
}

async function daily(bot: Bot<BotContext>) {
  // taking data
  const now = dayjs();
  const today = now.get("date");
  const weekDay = now.get("day");
  const currentMonth = now.get("month") + 1;
  const regions = await Model.PrayTime.find<IPrayTime>({
    day: today,
    month: currentMonth,
  });
  const file = new InputFile(resolve("public", "JumaMuborak.jpg"));
  const hadith = await getHadith();

  // sending
  for (const region of regions) {
    const users = await Model.User.find<IUser>({
      regionId: region.regionId,
      deletedAt: null,
      status: true,
    });

    for (const user of users) {
      const info = HLanguage("infoPrayTime");
      const message = HReplace(
        info,
        [
          "$region",
          "$fajr",
          "$sunrise",
          "$zuhr",
          "$asr",
          "$maghrib",
          "$isha",
          "$date",
        ],
        [
          region.region,
          region.fajr,
          region.sunrise,
          region.dhuhr,
          region.asr,
          region.maghrib,
          region.isha,
          now.format("DD/MM/YYYY"),
        ],
      );

      const keyboardText = HLanguage("mainKeyboard");
      const buttons = customKFunction(2, ...keyboardText);

      try {
        if (weekDay == 5) {
          await bot.api.sendPhoto(user.userId, file, {
            caption:
              `\n\n${message}\n\n<b>Kunlik hadis:</b>\n\n<pre>${hadith}</pre>`,
            parse_mode: "HTML",
          });
        } else {
          await bot.api.sendMessage(
            user.userId,
            message +
              (hadith ? `\n\n<b>Kunlik hadis:</b>${hadith}` : ""),
            {
              reply_markup: {
                keyboard: buttons.build(),
                resize_keyboard: true,
              },
              parse_mode: "HTML",
            },
          );
        }
      } catch (error: any) {
        await handleSendMessageError(error, user);
      }
    }
  }
}

async function reminder(bot: Bot<BotContext>) {


  type KVListenQueue = {
    key: string;
    regionId: number;
  }

  const now = dayjs();
  const today = now.get("date");
  const currentMonth = now.get("month") + 1;
  const regions = await Model.PrayTime.find<IPrayTime>({
    day: today,
    month: currentMonth,
  });
  const kv = await Deno.openKv();

  for (const region of regions) {

    const fajr = region.fajr.split(":");
    const fajrTime = now.clone().hour(+fajr[0]).minute(+fajr[1]).second(0).millisecond(0);
    const fajrDelay = now.diff(fajrTime, "millisecond");

    await kv.enqueue({key: "fajr", regionId: region.regionId}, { delay: fajrDelay });

    const sunrise = region.sunrise.split(":");
    const sunriseTime = now.clone().hour(+sunrise[0]).minute(+sunrise[1]).second(0).millisecond(0);
    const sunriseDelay = now.diff(sunriseTime, "millisecond");

    await kv.enqueue({key: "sunrise", regionId: region.regionId}, { delay: sunriseDelay });

    const dhuhr = region.dhuhr.split(":");
    const dhuhrTime = now.clone().hour(+dhuhr[0]).minute(+dhuhr[1]).second(0).millisecond(0);
    const dhuhrDelay = now.diff(dhuhrTime, "millisecond");

    await kv.enqueue({key: "dhuhr", regionId: region.regionId}, { delay: dhuhrDelay });

    const asr = region.asr.split(":");
    const asrTime = now.clone().hour(+asr[0]).minute(+asr[1]).second(0).millisecond(0);
    const asrDelay = now.diff(asrTime, "millisecond");

    await kv.enqueue({key: "asr", regionId: region.regionId}, { delay: asrDelay });

    const maghrib = region.maghrib.split(":");
    const maghribTime = now.clone().hour(+maghrib[0]).minute(+maghrib[1]).second(0).millisecond(0);
    const maghribDelay = now.diff(maghribTime, "millisecond");

    await kv.enqueue({key: "maghrib", regionId: region.regionId}, { delay: maghribDelay });

    const isha = region.isha.split(":");
    const ishaTime = now.clone().hour(+isha[0]).minute(+isha[1]).second(0).millisecond(0);
    const ishaDelay = now.diff(ishaTime, "millisecond");

    await kv.enqueue({key: "isha", regionId: region.regionId}, { delay: ishaDelay });

  }

  kv.listenQueue(async (input: KVListenQueue) => {
    
    const users = await Model.User.find<IUser>({
      "regionId": input.regionId,
      "deletedAt": null,
      "status": true,
      ["notificationSetting." + input.key]: true,
    });

    for (const user of users) {
      try {

        let message = HLanguage(input.key + "Time");

        if (user.fasting && input.key == "fajr") {

          message = HLanguage("closeFast");

        } else if (user.fasting && input.key == "maghrib") {

          message = HLanguage("breakFast");

        }

        await bot.api.sendMessage(user.userId, message);

      } catch (error: any) {
        await handleSendMessageError(error, user);
      }
    }

  });
}

async function weekly(bot: Bot<BotContext>) {
  const users = await Model.User.find<IUser>({
    status: true,
    deletedAt: null,
  });

  for (const user of users) {
    try {
      const message = HLanguage("shareBot");
      const keyboard = new InlineKeyboard();
      const enterMessage = HLanguage("enter");
      keyboard.url(enterMessage, "https://t.me/" + bot.botInfo.username);

      await bot.api.sendMessage(user.userId, message, {
        reply_markup: keyboard,
      });
    } catch (error: any) {
      await handleSendMessageError(error, user);
    }
  }
}

export async function cronStarter(bot: Bot<BotContext>) {

  Deno.cron('yearly',
    "0 20 31 12 *",
    async () => {
      await yearly();
    },
  );

  Deno.cron('daily',
    "0 21 * * *",
    async () => {
      await daily(bot);
      await reminder(bot);
    },
  );

  Deno.cron('weekly',
    "0 8 * * 1",
    async () => {
      await weekly(bot);
    },
  );

  await reminder(bot);
  await getHadith();
}
