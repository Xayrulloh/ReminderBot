import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import Data from "#database";
import { Keyboard } from "grammy";
import fs from 'fs'
import path from 'path'

let places = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'places', 'places.json'))), regions = Object.keys(places), cities = JSON.parse(fs.readFileSync(path.join(process.cwd(), "places", "cites.json")));
let newScene = new Scene("Location");

newScene.do(async (ctx) => {
  let buttons = replaceFunction(...regions);
  ctx.reply("Tumanni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true } });
});

newScene.wait().on("message:text", async (ctx) => {
  if (regions.includes(ctx.message.text)) {
    ctx.session.location = ctx.message.text;
    let buttons = replaceFunction(...Object.values(places[ctx.message.text]))

    ctx.reply("Shaxarni belgilang", {reply_markup: { keyboard: buttons.build(), resize_keyboard: true },});
    ctx.scene.resume();
  } else {
    let buttons = replaceFunction(...regions);
    ctx.reply("Tumanni belgilang", {reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

newScene.wait().on("message:text", async (ctx) => {
  if (Object.values(places[ctx.session.location]).includes(ctx.message.text)) {
    let user = await Data.findOne( { userId: ctx.update.message.from.id }), buttons = new Keyboard().text('🔍 Qidirish').row().text('🔴/🟢 Ogohlantirishni o\'zgartirish').row().text('📍 Joylashuvni o\'zgartirish')

    if (cities[ctx.message.text] == user.district) {
      ctx.reply( `Joylashuvingiz o'z holicha qoldi. Sababi oldin ham sizning joylashuvingiz ${ctx.message.text} bo'lgan ekan`, { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
      ctx.scene.exit();
    } else {
      user.location = ctx.session.location
      user.district = cities[ctx.message.text]
      user.save()

      ctx.reply("Joylashuvingiz o'zgartirildi", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
      ctx.scene.exit();
    }
  } else {
    let buttons = replaceFunction(...Object.values(places[ctx.session.location]));
    ctx.reply("Shaxarni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

export default newScene;