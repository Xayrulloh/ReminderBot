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

	if (!inlineQueryMessage) {
		responseObj.title = t(($) => $.startSearch);
		responseObj.description = t(($) => $.searchPlace);
		inputMessageContent.message_text = t(($) => $.hintMessage);

		return await ctx.answerInlineQuery([responseObj]);
	}

	const matches = fuzzy
		.filter(inlineQueryMessage, regionsData, { extract: (r) => r.name })
		.slice(0, 3);

	if (!matches.length) {
		responseObj.title = t(($) => $.notFound);
		responseObj.description = t(($) => $.notFoundDescription, {
			inlineQueryText: inlineQueryMessage,
		});
		inputMessageContent.message_text = t(($) => $.notFoundContent, {
			inlineQueryText: inlineQueryMessage,
		});

		return await ctx.answerInlineQuery([responseObj]);
	}

	const now = dayjs();
	const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? "";
	const keyboard = new InlineKeyboard()
		.url(
			t(($) => $.enter),
			`https://t.me/${ctx.me.username}`,
		)
		.row()
		.url(
			t(($) => $.addToGroup),
			`https://t.me/${ctx.me.username}?startgroup=${ctx.me.username}`,
		);

	const response: InlineQueryResult[] = [];

	for (const match of matches) {
		const region = match.original;
		const prayerTimes = getPrayerTimes(region.id, now.toDate());
		if (!prayerTimes) continue;

		const content = t(($) => $.infoPrayTime, {
			region: region.name,
			fajr: prayerTimes.fajr,
			sunrise: prayerTimes.sunrise,
			zuhr: prayerTimes.dhuhr,
			asr: prayerTimes.asr,
			maghrib: prayerTimes.maghrib,
			isha: prayerTimes.isha,
			date: now.format("DD/MM/YYYY"),
		});

		response.push({
			type: "article",
			id: crypto.randomUUID(),
			title: region.name,
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
