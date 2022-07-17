import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import Data from "#database";
import regionsFunction from "#region";

let newScene = new Scene("Start");

newScene.do(async (ctx) => {
  let buttons = replaceFunction( "Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm");
  ctx.reply("Joylashuvingizni beliglang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
});

newScene.wait().on("message:text", async (ctx) => {
  if (["Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm",].includes(ctx.message.text)) {
    ctx.session.location = ctx.message.text;

    let buttons = replaceFunction("Roziman", "Rozimasman");
    ctx.reply("Har namoz vaqti bo'lganda ogohlantirishga rozimisiz ?", {reply_markup: { keyboard: buttons.build(), resize_keyboard: true },});
    ctx.scene.resume();
  } else {
    let buttons = replaceFunction( "Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm");
    ctx.reply("Joylashuvingizni beliglang", {reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

newScene.wait().on("message:text", async (ctx) => {
  if (["Roziman", "Rozimasman"].includes(ctx.message.text)) {
    let data = await regionsFunction(ctx.session.location);

    await Data.create({ userId: ctx.update.message.from.id, notificationAllowed: ctx.message.text == "Roziman" ? true : false, location: ctx.session.location,});

    ctx.reply(data[0], { reply_markup: { remove_keyboard: true } });
    ctx.scene.exit();
  } else {
    let buttons = replaceFunction("Roziman", "Rozimasman");
    ctx.reply("Har namoz vaqti bo'lganda ogohlantirishga rozimisiz ?", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

export default newScene;