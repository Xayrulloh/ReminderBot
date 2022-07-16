import { Scene } from "grammy-scenes";
import replaceFunction from "#button";
import Data from "#database";

let newScene = new Scene("Notification");

newScene.do(async (ctx) => {
  let buttons = replaceFunction("Roziman", "Rozimasman");
  ctx.reply("Har namoz vaqti bo'lganda ogohlantirishga rozimisiz ?", {
    reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
  });
});

newScene.wait().on("message:text", async (ctx) => {
  if (["Roziman", "Rozimasman"].includes(ctx.message.text)) {
    let res = await Data.findOne(
      { userId: ctx.update.message.from.id },
      { notificationAllowed: true }
    );

    if (res.notificationAllowed == true && ctx.message.text == "Roziman") {
      ctx.reply(
        "Hech narsa o'zgartirilmadi. Sababi oldin ham rozi bo'lgan ekansiz!",
        { reply_markup: { remove_keyboard: true } }
      );
      ctx.scene.exit();
    } else if (
      ctx.message.text == "Rozimasman" &&
      res.notificationAllowed == false
    ) {
      ctx.reply(
        "Hech narsa o'zgartirilmadi. Sababi oldin ham rozi bo'lmagan ekansiz!",
        { reply_markup: { remove_keyboard: true } }
      );
      ctx.scene.exit();
    } else {
      await Data.updateOne(
        { userId: ctx.update.message.from.id },
        { notificationAllowed: ctx.message.text == "Roziman" ? true : false }
      );

      ctx.reply("O'zgartirildi", { reply_markup: { remove_keyboard: true } });
      ctx.scene.exit();
    }
  } else {
    let buttons = replaceFunction("Roziman", "Rozimasman");
    ctx.reply("Har namoz vaqti bo'lganda ogohlantirishga rozimisiz ?", {
      reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
    });
  }
});

export default newScene;
