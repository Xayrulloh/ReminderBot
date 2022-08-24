import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import Data from "#database";
import regionsFunction from "#region";
import { Keyboard } from "grammy";
import fs from 'fs'
import path from 'path'

let places = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'places', 'places.json'))), regions = Object.keys(places), cities = JSON.parse(fs.readFileSync(path.join(process.cwd(), "places", "cites.json")));
let newScene = new Scene("Start");

newScene.do(async (ctx) => {
  let buttons = replaceFunction(...regions);
  ctx.reply("Tumanni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
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

  if (cities[ctx.message.text]) {
    ctx.session.district = cities[ctx.message.text]

    let buttons = replaceFunction("Roziman", "Rozi emasman");
    ctx.reply("Har namoz vaqti bo'lganda ogohlantirishga rozimisiz ?", {reply_markup: { keyboard: buttons.build(), resize_keyboard: true },});
    ctx.scene.resume();
  } else {
    let buttons = replaceFunction(...Object.values(places[ctx.session.location]));
    ctx.reply("Shaxarni belgilang", {reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

newScene.wait().on("message:text", async (ctx) => {
  if (["Roziman", "Rozi emasman"].includes(ctx.message.text)) {
    let data = await regionsFunction(ctx.session.district), buttons = new Keyboard().text('🔍 Qidirish').row().text('🔴/🟢 Ogohlantirishni o\'zgartirish').row().text('📍 Joylashuvni o\'zgartirish')
    await Data.create({ userId: ctx.update.message.from.id, notificationAllowed: ctx.message.text == "Roziman" ? true : false, location: ctx.session.location, district: ctx.session.district});

    ctx.reply(data[0], { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
    ctx.scene.exit();
  } else {
    let buttons = replaceFunction("Roziman", "Rozi emasman");
    ctx.reply("Har namoz vaqti bo'lganda ogohlantirishga rozimisiz ?", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

export default newScene;