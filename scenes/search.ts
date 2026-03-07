import { InlineKeyboard } from "grammy";
import { Scene } from "grammy-scenes";
import { t } from "#config/i18n";
import regionsData from "#config/regions.json";
import { memoryStorage } from "#config/storage";
import inlineKFunction from "#keyboard/inline";
import type { BotContext } from "#types/context";
import { DAILY_HADITH_KEY } from "#utils/constants";
import dayjs from "#utils/dayjs";
import { getPrayerTimes } from "#utils/prayerTimes";

const REGION_IDS = regionsData.map((r) => r.id);
const REGION_KEYBOARD = regionsData.map((r) => ({
	view: r.name,
	text: String(r.id),
}));

const scene = new Scene<BotContext>("Search");

scene.step(async (ctx) => {
	const buttons = inlineKFunction(3, REGION_KEYBOARD);

	ctx.session.currPage = 1;

	await ctx.reply(
		t(($) => $.searchRegion),
		{ reply_markup: buttons },
	);
});

scene.wait("region").on("callback_query:data", async (ctx) => {
	const inputData = ctx.update.callback_query.data;

	if (REGION_IDS.includes(+inputData) || ["<", ">"].includes(inputData)) {
		if (["<", ">", "pageNumber"].includes(inputData)) {
			if (inputData === "<" && ctx.session.currPage !== 1) {
				await ctx.answerCallbackQuery();

				const buttons = inlineKFunction(
					3,
					REGION_KEYBOARD,
					--ctx.session.currPage,
				);

				await ctx.editMessageText(
					t(($) => $.searchRegion),
					{
						reply_markup: buttons,
					},
				);
			} else if (
				inputData === ">" &&
				ctx.session.currPage * 12 <= REGION_IDS.length
			) {
				await ctx.answerCallbackQuery();

				const buttons = inlineKFunction(
					3,
					REGION_KEYBOARD,
					++ctx.session.currPage,
				);

				await ctx.editMessageText(
					t(($) => $.searchRegion),
					{
						reply_markup: buttons,
					},
				);
			} else {
				await ctx.answerCallbackQuery(t(($) => $.wrongSelection));
			}
		} else {
			await ctx.answerCallbackQuery();

			const selectDayKeyboard = new InlineKeyboard();
			ctx.session.selectedRegionId = +inputData;

			for (const dayOption of t(($) => $.selectDayOptions, {
				returnObjects: true,
			})) {
				selectDayKeyboard.text(dayOption);
			}

			await ctx.editMessageText(
				t(($) => $.selectDay),
				{ reply_markup: selectDayKeyboard },
			);
			return ctx.scene.resume();
		}
	} else {
		await ctx.answerCallbackQuery(t(($) => $.wrongSelection));
	}
});

scene.wait("commonDays").on("callback_query:data", async (ctx) => {
	const dayInput = ctx.callbackQuery.data;
	const dayOptions = t(($) => $.selectDayOptions, { returnObjects: true });
	const now = dayjs();
	let day: number;

	switch (dayInput) {
		// today
		case dayOptions[0]:
			day = now.get("date");
			break;
		// other day
		case dayOptions[1]: {
			const daysKeyboard = new InlineKeyboard();
			const daysInMonth = new Date(
				now.get("year"),
				now.get("month") + 1,
				0,
			).getDate();
			for (let i = 1; i <= daysInMonth; i++) {
				daysKeyboard.text(i.toString());
				if (i % 5 === 0) {
					daysKeyboard.row();
				}
			}
			await ctx.editMessageReplyMarkup({
				reply_markup: daysKeyboard,
			});
			return;
		}
		// custom day
		default:
			day = Number(dayInput);
			break;
	}
	const data = getPrayerTimes(
		ctx.session.selectedRegionId,
		new Date(now.get("year"), now.get("month"), day),
	);

	if (!data) return ctx.scene.exit();

	const response = t(($) => $.infoPrayTime, {
		region: data.region,
		fajr: data.fajr,
		sunrise: data.sunrise,
		zuhr: data.dhuhr,
		asr: data.asr,
		maghrib: data.maghrib,
		isha: data.isha,
		date: new Date(now.get("year"), now.get("month"), day).toLocaleDateString(),
	});

	const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String();

	await ctx.editMessageText(response + dailyHadith, { parse_mode: "HTML" });

	ctx.scene.exit();
});

export default scene;
