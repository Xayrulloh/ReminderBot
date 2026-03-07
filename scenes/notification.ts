import { InlineKeyboard } from "grammy";
import { Scene } from "grammy-scenes";
import Model from "#config/database";
import { t } from "#config/i18n";
import type { BotContext } from "#types/context";
import type { IUser } from "#types/database";

const PRAYER_KEYS: (keyof IUser["notificationSetting"])[] = [
	"fajr",
	"sunrise",
	"dhuhr",
	"asr",
	"maghrib",
	"isha",
];

const scene = new Scene<BotContext>("Notification");

scene.step(async (ctx) => {
	ctx.session.notificationSetting = ctx.user.notificationSetting;

	const settingKeyboard = buildSettingKeyboard(ctx.session.notificationSetting);

	await ctx.reply(
		t(($) => $.setPrayerTimes),
		{
			reply_markup: settingKeyboard,
		},
	);
});

scene.wait("notification_settings").on("callback_query:data", async (ctx) => {
	const data = ctx.callbackQuery.data;
	const validKeys = [...PRAYER_KEYS, "save"] as string[];

	if (!validKeys.includes(data)) {
		return ctx.answerCallbackQuery(t(($) => $.wrongSelection));
	}

	await ctx.answerCallbackQuery();

	if (data !== "save") {
		ctx.session.notificationSetting[data] =
			!ctx.session.notificationSetting[data];
		const settingKeyboard = buildSettingKeyboard(
			ctx.session.notificationSetting,
		);
		return ctx.editMessageText(
			t(($) => $.setPrayerTimes),
			{
				reply_markup: settingKeyboard,
			},
		);
	}

	await Model.User.updateOne<IUser>(
		{ userId: ctx.user.userId },
		{
			notificationSetting: ctx.session.notificationSetting,
		},
	);
	await ctx.editMessageText(t(($) => $.notifChange));
	return ctx.scene.exit();
});

function buildSettingKeyboard(notificationSetting: Record<string, boolean>) {
	const keyboard = new InlineKeyboard();
	const labels = t(($) => $.setPrayerTimesKeyboard, {
		returnObjects: true,
	});

	for (let i = 0; i < PRAYER_KEYS.length; i++) {
		const key = PRAYER_KEYS[i];
		const icon = notificationSetting[key] ? "✅" : "❌";
		keyboard.text(labels[key] + icon, key);

		if (i % 2) {
			keyboard.row();
		}
	}

	keyboard.text(labels.save, "save");

	return keyboard;
}

export default scene;
