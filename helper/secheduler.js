import scheduler from "node-schedule";
import regionsFunction from "#region";
import Data from "#database";
import fs from "fs";
import path from "path";

async function Times() {
  let places = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "places", "places.json"))
  );
  let namozTime = ["Bomdod", "Quyosh", "Peshin", "Asr", "Shom", "Xufton"];

  // clear scheduler
  await scheduler.gracefulShutdown();

  // time reminder
  for (let region in places) {
    for (let district in places[region]) {
      let answer = await regionsFunction(district);

      answer[1].forEach((el, index) => {
        el = el.split(":").map((el) => el.replace(/^0/, ""));

        scheduler.scheduleJob({ hour: el[0], minute: el[1] }, async () => {
          let usersOfRegion = await Data.find(
            {
              $or: [{ location: district }, { district: district }],
              notificationAllowed: true,
            },
            { userId: true, _id: false, location: true }
          );

          usersOfRegion.forEach(async (user) => {
            if (namozTime[index] == "Quyosh") {
              bot.api
                .sendMessage(user.userId, "Bomdod vaqti o'tib ketdi")
                .catch(async (error) => {
                  if (
                    error.description ==
                    "Forbidden: bot was blocked by the user"
                  ) {
                  }
                  await Data.deleteOne({ userId: user.userId });
                });
            } else if (
              namozTime[index] == "Peshin" &&
              new Date().getDay() == 5
            ) {
              bot.api
                .sendMessage(user.userId, "Juma vaqti bo'ldi")
                .catch(async (error) => {
                  if (
                    error.description ==
                    "Forbidden: bot was blocked by the user"
                  ) {
                  }
                  await Data.deleteOne({ userId: user.userId });
                });
            } else {
              bot.api
                .sendMessage(user.userId, `🕌 ${namozTime[index]} vaqti bo'ldi`)
                .catch(async (error) => {
                  if (
                    error.description ==
                    "Forbidden: bot was blocked by the user"
                  ) {
                  }
                  await Data.deleteOne({ userId: user.userId });
                });
            }
          });
        });
      });
    }
  }
}

async function dailyReminder() {
  // daily reminder
  let users = await Data.find( {}, { userId: true, _id: false, location: true, district: true })
  let buttons = new Keyboard().text("🔍 Qidirish").row().text("🔴/🟢 Ogohlantirishni o'zgartirish").row().text("📍 Joylashuvni o'zgartirish");

  await regionsFunction("tashkent", "newDay");

  users.forEach(async (user) => {
    let data = await regionsFunction(user.district);
    bot.api.sendMessage(user.userId, data[0], {  reply_markup: { keyboard: buttons.build(), resize_keyboard: true },}).catch(async (error) => {  if (error.description == "Forbidden: bot was blocked by the user") {  }  await Data.deleteOne({ userId: user.userId });});
  });
}

export { Times, dailyReminder };
