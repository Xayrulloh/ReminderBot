import { Scene } from "grammy-scenes";
import Model from "#config/database.ts";
import HLanguage from "#helper/language.ts";
import { InlineKeyboard } from "grammy";
import { HReplace } from "#helper/replacer.ts";
import { BotContext } from "#types/context.ts";
import { IUser } from "#types/database.ts";

const scene = new Scene<BotContext>("Notification");

scene.step(async (ctx) => {
    const message = HLanguage("setPrayerTimes");
    const setPrayerTimesMessage = HLanguage("setPrayerTimesKeyboard");

    ctx.session.notificationSetting = ctx.user.notificationSetting;
    ctx.session.setPrayerTimesMessage = setPrayerTimesMessage;
    ctx.session.message = message;
    ctx.session.prayerTimes = Object.keys(setPrayerTimesMessage);

    const settingKeyboard = buildSettingKeyboard(ctx);

    await ctx.reply(message, { reply_markup: settingKeyboard });
});

scene.wait("notification_settings").on("callback_query:data", async (ctx) => {
    if (!ctx.session.setPrayerTimesMessage[ctx.callbackQuery.data]) {
        return ctx.answerCallbackQuery(HLanguage("wrongSelection"));
    }

    await ctx.answerCallbackQuery();

    if (ctx.callbackQuery.data !== "save") {
        ctx.session.notificationSetting[ctx.callbackQuery.data] = !ctx.session
            .notificationSetting[ctx.callbackQuery.data];
        const settingKeyboard = buildSettingKeyboard(ctx);
        return ctx.editMessageText(ctx.session.message, {
            reply_markup: settingKeyboard,
        });
    }

    await Model.User.updateOne<IUser>(
        { userId: ctx.user.userId },
        {
            notificationSetting: ctx.session.notificationSetting,
        },
    );
    await ctx.editMessageText(HLanguage("notifChange"));
    return ctx.scene.exit();
});

function buildSettingKeyboard(ctx: BotContext) {
    const keyboard = new InlineKeyboard();

    for (const index in ctx.session.prayerTimes) {
        const key = ctx.session.prayerTimes[index];
        let text = ctx.session.setPrayerTimesMessage[key];

        if (key !== "save") {
            text = HReplace(
                ctx.session.setPrayerTimesMessage[key],
                ["$state"],
                [ctx.session.notificationSetting[key] ? "✅" : "❌"],
            );
        }

        keyboard.text(text, key);

        if (parseInt(index) % 2) {
            keyboard.row();
        }
    }

    return keyboard;
}

export default scene;
