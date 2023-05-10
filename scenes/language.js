import { Scene } from "npm:grammy-scenes";
import Model from "../config/database.js";
import inlineKFunction from "../keyboard/inline.js";
import customKFunction from "../keyboard/custom.js";
import HLanguage from "../helper/language.js";

const scene = new Scene("Language");

scene.do(async (ctx) => {
  const buttons = inlineKFunction(
    Infinity,
    { view: "🇺🇿", text: "uz" },
    { view: "🇷🇺", text: "ru" },
    { view: "🇺🇸", text: "en" }
  );
  const userId = ctx.update.message.from.id;
  const user = await Model.User.findOne({ userId });
  const message = HLanguage(user.language, "chooseLanguage");

  ctx.session.message = message;
  ctx.session.buttons = buttons;

  ctx.reply(message, { reply_markup: buttons });
});

scene.wait().on("callback_query:data", async (ctx) => {
  ctx.answerCallbackQuery();

  const language = ctx.update.callback_query.data;
  if (!["uz", "ru", "en"].includes(language)) {
    ctx.reply(ctx.session.message, { reply_markup: ctx.session.buttons });
    return;
  }

  const userId = ctx.update.callback_query.from.id;
  const message = HLanguage(language, "changedLanguage");

  await Model.User.updateOne({ userId }, { language });

  const keyboardText = HLanguage(language, "mainKeyboard");
  const buttons = customKFunction(2, ...keyboardText);

  ctx.reply(message, {
    reply_markup: { keyboard: buttons.build(), resize_keyboard: true },
  });
  ctx.scene.exit();
});

export default scene;
