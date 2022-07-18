import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import Data from "#database";

let newScene = new Scene("Location");

newScene.do(async (ctx) => {
  let buttons = replaceFunction("Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm");
  ctx.reply("Yangi joyni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true } });
});

newScene.wait().on("message:text", async (ctx) => {
  if ([ "Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm",].includes(ctx.message.text)) {
    let res = await Data.findOne( { userId: ctx.update.message.from.id }, { location: true });

    if (ctx.message.text == res.location) {
      ctx.reply( `Joylashuvingiz o'z holicha qoldi. Sababi oldin ham sizning joylashuvingiz ${res.location} bo'lgan ekan`, { reply_markup: { remove_keyboard: true } });
      ctx.scene.exit();
    } else {
      await Data.updateOne( { userId: ctx.update.message.from.id }, { location: ctx.message.text } );

      ctx.reply("Joylashuvingiz o'zgartirildi", { reply_markup: { remove_keyboard: true } });
      ctx.scene.exit();
    }
  } else {
    let buttons = replaceFunction( "Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm");
    ctx.reply("Yangi joyni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

export default newScene;