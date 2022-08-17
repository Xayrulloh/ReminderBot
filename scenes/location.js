import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import Data from "#database";
import { Keyboard } from "grammy";

let newScene = new Scene("Location");

newScene.do(async (ctx) => {
  let buttons = replaceFunction("Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm");
  ctx.reply("Yangi joylashuvingizni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true } });
});

newScene.wait().on("message:text", async (ctx) => {
  if (["Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm"].includes(ctx.message.text)) {
    let res = await Data.findOne( { userId: ctx.update.message.from.id }, { location: true }), buttons = new Keyboard().text('🔍 Qidirish').row().text('🔴/🟢 Ogohlantirishni o\'zgartirish').row().text('📍 Joylashuvni o\'zgartirish')

    if (ctx.message.text == res.location) {
      ctx.reply( `Joylashuvingiz o'z holicha qoldi. Sababi oldin ham sizning joylashuvingiz ${res.location} bo'lgan ekan`, { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
      ctx.scene.exit();
    } else {
      await Data.updateOne( { userId: ctx.update.message.from.id }, { location: ctx.message.text } );

      ctx.reply("Joylashuvingiz o'zgartirildi", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
      ctx.scene.exit();
    }
  } else {
    let buttons = replaceFunction("Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm");
    ctx.reply("Yangi joylashuvingizni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

export default newScene;