import { Scene } from "grammy-scenes";
import { BotContext } from "#types/context.ts";
import HLanguage from "#helper/language.ts";
import { InlineKeyboard } from "grammy";
import { env } from "#utils/env.ts";

const scene = new Scene<BotContext>("Quran");

scene.step(async (ctx) => {
    const message = HLanguage("share_qu'ron_va_tafsiri");
    const keyboard = new InlineKeyboard();
    const enterMessage = HLanguage("enter");

    keyboard.url(enterMessage, env.QURON_VA_TAFSIRI_URL);

    await ctx.reply(message, { reply_markup: keyboard });

    ctx.scene.exit();
});

export default scene;
