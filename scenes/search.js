import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import regionsFunction from "#region";

let newScene = new Scene("Search");

newScene.do(async (ctx) => {
  let buttons = replaceFunction("Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm");
  ctx.reply("Qidirayotgan hududingizni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true },});
});

newScene.wait().on("message:text", async (ctx) => {
  if (["Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm",].includes(ctx.message.text)) {
    let data = await regionsFunction(ctx.message.text);
    ctx.reply(data[0], { reply_markup: { remove_keyboard: true } });
    ctx.scene.exit();
  } else {
    let buttons = replaceFunction("Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm");
    ctx.reply("Qidirayotgan hududingizni belgilang", { reply_markup: { keyboard: buttons.build(), resize_keyboard: true }});
  }
});

export default newScene;
