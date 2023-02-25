import { Bot, session, GrammyError, HttpError } from "grammy";
import { scenes } from "./scenes/index.js";
import "dotenv/config";
import Data from "#database";
import { Keyboard } from "grammy";
import query from "./inline_query/query.js";
import Heart from "./helper/heart.js";

const token = process.env.TOKEN
const bot = new Bot(token);

// middlewares
bot.use(session({ initial: () => ({}) }));
bot.use(scenes.manager());
bot.use(scenes);

// inline query
bot.inlineQuery(/(.*)/gi, (ctx) => {
  query(ctx);
});

// Commands
bot.command("start", async (ctx) => {
  if (await Data.findOne({ userId: ctx.update.message.from.id })) {
    ctx.reply(
      "Assalomu alaykum.\n/notification — ushbu buyruq orqali siz har namoz vaqtidagi ogohlantirishni o'zgartirishingiz mumkun.\n/search — ushbu buyruq orqali siz O'zbekistonning qolgan hududlaridagi namoz vaqtlaridan xabardor bo'lishingiz mumkun.\n/location — ushbu buyruq orqali siz joylashuvingizni qaytadan kiritishingiz mumkun.\nEslatib o'tamiz ushbu buyruqlarning barchasi <b>Menu</b> xizmatida joylashgan.\nE'tiboringiz uchun rahmat.",
      { parse_mode: "HTML" }
    );
    return;
  }
  await ctx.scenes.enter("Start");
});

bot.command("notification", async (ctx) => {
  if (!(await Data.findOne({ userId: ctx.update.message.from.id }))) {
    return await ctx.scenes.enter("Start");
  }
  await ctx.scenes.enter("Notification");
});

bot.command("location", async (ctx) => {
  if (!(await Data.findOne({ userId: ctx.update.message.from.id }))) {
    return await ctx.scenes.enter("Start");
  }
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

bot.on("message:text", async (ctx) => {
  if (!(await Data.findOne({ userId: ctx.update.message.from.id }))) {
    return await ctx.scenes.enter("Start");
  }
  let buttons = new Keyboard().text('🔍 Qidirish').row().text('🔴/🟢 Ogohlantirishni o\'zgartirish').row().text('📍 Joylashuvni o\'zgartirish')
  if (ctx.message.text === '🔍 Qidirish') {
    ctx.scenes.enter('Search')
  } else if (ctx.message.text === '🔴/🟢 Ogohlantirishni o\'zgartirish') {
    ctx.scenes.enter('Notification')
  } else if (ctx.message.text === '📍 Joylashuvni o\'zgartirish') {
    ctx.scenes.enter('Location')
  } else {
    ctx.reply('Assalomu alaykum.\n/notification — ushbu buyruq orqali siz har namoz vaqtidagi ogohlantirishni o\'zgartirishingiz mumkun.\n/search — ushbu buyruq orqali siz O\'zbekistonning qolgan hududlaridagi namoz vaqtlaridan xabardor bo\'lishingiz mumkun.\n/location — ushbu buyruq orqali siz joylashuvingizni qaytadan kiritishingiz mumkun.\nEslatib o\'tamiz ushbu buyruqlarning barchasi <b>Menu</b> xizmatida joylashgan.\nE\'tiboringiz uchun rahmat.', { parse_mode: "HTML", reply_markup: { keyboard: buttons.build(), resize_keyboard: true } })
  }
})

// error handling
bot.catch((err) => {
  const ctx = err.ctx, error = err.error, name = err.name;
  const response = `By: ${ctx.update.message.from.id}\nUsername: @${ctx.update.message.from.username}\nError: ${name}\nError message: ${error.message}`
  bot.api.sendMessage(1151533771, response)
  bot.api.sendMessage(722785022, response)
});

bot.start();

Heart();
