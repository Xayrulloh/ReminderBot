import crypto from "node:crypto";
import type { InlineQueryResult, InputMessageContent } from "@grammyjs/types";
import fuzzy from "fuzzy";
import { InlineKeyboard } from "grammy";
import { t } from "#config/i18n";
import regionsData from "#config/regions.json";
import { memoryStorage } from "#config/storage";
import type { BotContext } from "#types/context";
import { DAILY_HADITH_KEY } from "#utils/constants";
import dayjs from "#utils/dayjs";
import { getPrayerTimes } from "#utils/prayerTimes";

export async function inlineQuery(ctx: BotContext) {
	const inlineQueryMessage = ctx.inlineQuery?.query;
	const tryAgain: string = t(($) => $.tryAgain);
	const inputMessageContent: InputMessageContent = {
		parse_mode: "HTML",
		message_text: "",
	};
	const responseObj: InlineQueryResult = {
		type: "article",
		id: crypto.randomUUID(),
		title: "",
		reply_markup: new InlineKeyboard().switchInlineCurrent(tryAgain, ""),
		input_message_content: inputMessageContent,
	};

	// if not inline query
	if (!inlineQueryMessage) {
		responseObj.title = t(($) => $.startSearch);
		responseObj.description = t(($) => $.searchPlace);
		inputMessageContent.message_text = t(($) => $.hintMessage);

		return await ctx.answerInlineQuery([responseObj]);
	}

	// if exist inline query
	const search = fuzzy.filter(
		inlineQueryMessage,
		regionsData.map((r) => r.name),
	);

	// but not result
	if (!search.length) {
		responseObj.title = t(($) => $.notFound);
		responseObj.description = t(($) => $.notFoundDescription, {
			inlineQueryText: inlineQueryMessage,
		});
		inputMessageContent.message_text = t(($) => $.notFoundContent, {
			inlineQueryText: inlineQueryMessage,
		});

		return await ctx.answerInlineQuery([responseObj]);
	}

	// if result is exist
	const regionIds = [
		...new Set(
			search
				.map((result) => regionsData.find((r) => r.name === result.string)?.id)
				.filter((id): id is number => id !== undefined),
		),
	].slice(0, 3);

	const now = dayjs();
	const prayerRegions = regionIds
		.map((id) => getPrayerTimes(id, now.toDate()))
		.filter((r): r is NonNullable<typeof r> => r !== null);
	const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String();
	const response: InlineQueryResult[] = [];
	const keyboard = new InlineKeyboard();
	const enterMessage = t(($) => $.enter);
	const addToGroupMessage = t(($) => $.addToGroup);

	keyboard.url(enterMessage, `https://t.me/${ctx.me.username}`);
	keyboard.row();
	keyboard.url(
		addToGroupMessage,
		`https://t.me/${ctx.me.username}?startgroup=${ctx.me.username}`,
	);

	for (const region of prayerRegions) {
		const regionName =
			regionsData.find((r) => r.id === region.regionId)?.name ?? "";

		const content = t(($) => $.infoPrayTime, {
			region: regionName,
			fajr: region.fajr,
			sunrise: region.sunrise,
			zuhr: region.dhuhr,
			asr: region.asr,
			maghrib: region.maghrib,
			isha: region.isha,
			date: now.format("DD/MM/YYYY"),
		});

		response.push({
			type: "article",
			id: crypto.randomUUID(),
			title: regionName,
			description: content,
			input_message_content: {
				message_text: content + dailyHadith,
				parse_mode: "HTML",
			},
			reply_markup: keyboard,
		});
	}

	return await ctx.answerInlineQuery(response);
}
