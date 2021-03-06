import { Bot, session } from "grammy";
import { scenes } from "./scenes/index.js";
import "dotenv/config";
import Data from "#database";
import regionsFunction from "#region";
import scheduler from "node-schedule";

const token = process.env.TOKEN, bot = new Bot(token);
let remainingTime = 86400000 - (new Date().getHours() * 60 * 60 + new Date().getMinutes() * 60 + new Date().getSeconds()) * 1000;

// middlewares
bot.use(session({ initial: () => ({}) }));
bot.use(scenes.manager());
bot.use(scenes);

// Commands
bot.command("start", async (ctx) => {
  if (await Data.findOne({ userId: ctx.update.message.from.id })) { ctx.reply('Assalomu alaykum.\n/notification — ushbu buyruq orqali siz har namoz vaqtidagi ogohlantirishni o\'zgartirishingiz mumkun.\n/search — ushbu buyruq orqali siz O\'zbekistonning qolgan hududlaridagi namoz vaqtlaridan xabardor bo\'lishingiz mumkun.\n/location — ushbu buyruq orqali siz joylashuvingizni qaytadan kiritishingiz mumkun.\nEslatib o\'tamiz ushbu buyruqlarning barchasi <b>Menu</b> xizmatida joylashgan.\nE\'tiboringiz uchun rahmat.', { parse_mode: "HTML" }); return; }
  await ctx.scenes.enter("Start");
});

bot.command("notification", async (ctx) => {
  await ctx.scenes.enter("Notification");
});

bot.command("location", async (ctx) => {
  await ctx.scenes.enter("Location");
});

bot.command("search", async (ctx) => {
  await ctx.scenes.enter("Search");
});

bot.command("statistic", async (ctx) => {
  await ctx.scenes.enter("Statistic");
});

bot.command("advertise", async (ctx) => {
  await ctx.scenes.enter("Advertise");
});

bot.on('message:text', async (ctx) => {
  ctx.reply('Assalomu alaykum.\n/notification — ushbu buyruq orqali siz har namoz vaqtidagi ogohlantirishni o\'zgartirishingiz mumkun.\n/search — ushbu buyruq orqali siz O\'zbekistonning qolgan hududlaridagi namoz vaqtlaridan xabardor bo\'lishingiz mumkun.\n/location — ushbu buyruq orqali siz joylashuvingizni qaytadan kiritishingiz mumkun.\nEslatib o\'tamiz ushbu buyruqlarning barchasi <b>Menu</b> xizmatida joylashgan.\nE\'tiboringiz uchun rahmat.', { parse_mode: "HTML" })
})

bot.start();

Times()

if (remainingTime != 0) {
  let interval1 = setInterval(async () => {
    dailyReminder()
    Times();

    setInterval(async () => {
      dailyReminder()
      Times();
    }, 86400000);
    
    clearInterval(interval1)
  }, remainingTime);
  
} else {
  setInterval(async () => {
    dailyReminder()
    Times();
  }, 86400000);
}

async function Times() {
    // clear scheduler
    await scheduler.gracefulShutdown();
    
    // time reminder
    let regions = ["Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm"];
    let namozTime = ["Bomdod", "Quyosh", "Peshin", "Asr", "Shom", "Xufton"];
    
    for (let region of regions) {
      let answer = await regionsFunction(region);
      
      answer[1].forEach((el, index) => {
        el = el.split(":").map((el) => el.replace(/^0/, ""));
        scheduler.scheduleJob({ hour: el[0], minute: el[1] }, async () => {
          let usersOfRegion = await Data.find({ location: region, notificationAllowed: true }, { userId: true, _id: false, location: true });
          usersOfRegion.forEach(async (user) => {
            if (namozTime[index] == "Quyosh") { bot.api.sendMessage(user.userId, "Bomdod vaqti o'tib ketdi").catch(async error => {if (error.response && error.response.statusCode === 403) {}; await Data.deleteOne({userId: user.userId})});
            } else { bot.api.sendMessage(user.userId,`🕌 ${namozTime[index]} vaqti bo'ldi`).catch(async error => {if (error.response && error.response.statusCode === 403) {}; await Data.deleteOne({userId: user.userId})}); }
          });
        });
      });
    }
}

async function dailyReminder() {
  // daily reminder
  let users = await Data.find({}, { userId: true, _id: false, location: true });
  users.forEach(async (user) => {
    let data = await regionsFunction(user.location);
    bot.api.sendMessage(user.userId, data[0]).catch(async error => {if (error.response && error.response.statusCode === 403) {}; await Data.deleteOne({userId: user.userId})})
  });
}