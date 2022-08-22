import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import regionsFunction from "#region";
import { Keyboard } from "grammy";
import fs from 'fs'
import path from 'path'

let places = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'places', 'places.json')))
let regions = Object.keys(places)
let newScene = new Scene("Search");

newScene.do(async (ctx) => {
  let buttons = replaceFunction(...regions);
  ctx.reply("Tumanni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true },});
});

newScene.wait().on("message:text", async (ctx) => {
  if (regions.includes(ctx.message.text)) {
    ctx.session.location = ctx.message.text
    let buttons = replaceFunction(...Object.values(places[ctx.session.location]))

    ctx.reply("Shaxarni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
    ctx.scene.resume();
  } else {
    let buttons = replaceFunction(...regions);
    ctx.reply("Tumanni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

newScene.wait().on("message:text", async (ctx) => {
  if (Object.values(places[ctx.session.location]).includes(ctx.message.text)) {
    let values = Object.values(places[ctx.session.location]), keys = Object.keys(places[ctx.session.location])
    let data = await regionsFunction(keys[values.findIndex(el => el == ctx.message.text)]), buttons = new Keyboard().text('🔍 Qidirish').row().text('🔴/🟢 Ogohlantirishni o\'zgartirish').row().text('📍 Joylashuvni o\'zgartirish')

    ctx.reply(data[0], { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
    ctx.scene.exit();
  } else {
    let buttons = replaceFunction(Object.values(places[ctx.session.location]));
    ctx.reply("Shaxarni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

export default newScene;