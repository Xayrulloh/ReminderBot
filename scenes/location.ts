import { Scene } from "grammy-scenes";
import Model from "#config/database";
import { t } from "#config/i18n";
import regionsData from "#config/regions.json";
import { memoryStorage } from "#config/storage";
import inlineKFunction from "#keyboard/inline";
import type { BotContext } from "#types/context";
import type { IUser } from "#types/database";
import { DAILY_HADITH_KEY } from "#utils/constants";
import dayjs from "#utils/dayjs";
import { getPrayerTimes } from "#utils/prayerTimes";

const REGION_IDS = regionsData.map((r) => r.id);
const REGION_KEYBOARD = regionsData.map((r) => ({
	view: r.name,
	text: String(r.id),
}));

function getLocationMessage(ctx: BotContext) {
	return `${t(($) => $.currentRegion)} <b>${ctx.user.region}</b>\n\n ${t(($) => $.chooseRegion)}`;
}

const scene = new Scene<BotContext>("Location");

scene.step(async (ctx) => {
	const message = getLocationMessage(ctx);
	const buttons = inlineKFunction(3, REGION_KEYBOARD);

	ctx.session.currPage = 1;

	await ctx.reply(message, { reply_markup: buttons, parse_mode: "HTML" });
});

scene.wait("location").on("callback_query:data", async (ctx) => {
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

				await ctx.editMessageText(getLocationMessage(ctx), {
					reply_markup: buttons,
					parse_mode: "HTML",
				});
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

				await ctx.editMessageText(getLocationMessage(ctx), {
					reply_markup: buttons,
					parse_mode: "HTML",
				});
			} else {
				await ctx.answerCallbackQuery(t(($) => $.wrongSelection));
			}
		} else {
			await ctx.answerCallbackQuery();

			const now = dayjs();
			const data = getPrayerTimes(+inputData, now.toDate());
			if (!data) return ctx.scene.exit();

			const regionName =
				regionsData.find((r) => r.id === data.regionId)?.name ?? "";

			await Model.User.updateOne<IUser>(
				{ userId: ctx.user.userId },
				{ region: regionName, regionId: +inputData },
			);

			ctx.user.region = regionName;
			ctx.user.regionId = +inputData;

			const response = t(($) => $.infoPrayTime, {
				region: data.region,
				fajr: data.fajr,
				sunrise: data.sunrise,
				zuhr: data.dhuhr,
				asr: data.asr,
				maghrib: data.maghrib,
				isha: data.isha,
				date: now.format("DD/MM/YYYY"),
			});
			const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String();
			const locationMessage = t(($) => $.locationChange);

			await ctx.editMessageText(
				`${locationMessage}\n\n${response}${dailyHadith}`,
				{
					parse_mode: "HTML",
				},
			);

			ctx.scene.exit();
		}
	} else {
		await ctx.answerCallbackQuery(t(($) => $.wrongSelection));
	}
});

export default scene;
