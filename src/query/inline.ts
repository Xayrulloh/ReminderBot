import { InlineKeyboard } from "grammy";
import Model from "#config/database.ts";
import HLanguage from "#helper/language.ts";
import { HReplace } from "#helper/replacer.ts";
import { BotContext } from "#types/context.ts";
import { InlineQueryResult, InputMessageContent } from "@grammyjs/types";
import { crypto } from "@std/crypto";
import fuzzy from "fuzzy";
import { memoryStorage } from "#config/storage.ts";
import { DAILY_HADITH_KEY } from "#utils/constants.ts";
import { IPrayTime } from "#types/database.ts";
import dayjs from "#utils/dayjs.ts";

export async function inlineQuery(ctx: BotContext) {
    const inlineQueryMessage = ctx.inlineQuery?.query;
    const tryAgain: string = HLanguage("tryAgain");
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
        responseObj.title = HLanguage("startSearch");
        responseObj.description = HLanguage("searchPlace");
        inputMessageContent.message_text = HLanguage("hintMessage");

        return await ctx.answerInlineQuery([responseObj]);
    }

    // if exist inline query
    const allRegions = HLanguage("region");
    const search = fuzzy.filter(inlineQueryMessage, Object.keys(allRegions));

    // but not result
    if (!search.length) {
        responseObj.title = HLanguage("notFound");
        const description: string = HLanguage("notFoundDescription");
        const message_text: string = HLanguage("notFoundContent");

        responseObj.description = HReplace(description, ["$inlineQueryText"], [
            inlineQueryMessage,
        ]);
        inputMessageContent.message_text = HReplace(message_text, [
            "$inlineQueryText",
        ], [inlineQueryMessage]);

        return await ctx.answerInlineQuery([responseObj]);
    }

    // if result is exist
    let regionIds = [];

    for (const result of search) {
        for (const key in allRegions) {
            if (key == result.string) regionIds.push(allRegions[key]);
        }
    }

    regionIds = [...new Set(regionIds)].slice(0, 3);

    const now = dayjs();
    const today = now.get("date");
    const currentMonth = now.get("month") + 1;
    const regionTranslations: Record<string, number> = HLanguage("region");
    const regions = await Model.PrayTime.find<IPrayTime>({
        day: today,
        regionId: regionIds,
        month: currentMonth,
    });
    const message = HLanguage("infoPrayTime");
    const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String();
    const response: InlineQueryResult[] = [];
    const keyboard = new InlineKeyboard();
    const enterMessage = HLanguage("enter");

    keyboard.url(enterMessage, "https://t.me/" + ctx.me.username);

    for (const region of regions) {
        let regionName = "";

        for (const key in regionTranslations) {
            if (region.regionId === regionTranslations[key]) {
                regionName = key;
            }
        }

        const content = HReplace(
            message,
            [
                "$region",
                "$fajr",
                "$sunrise",
                "$zuhr",
                "$asr",
                "$maghrib",
                "$isha",
                "$date",
            ],
            [
                regionName,
                region.fajr,
                region.sunrise,
                region.dhuhr,
                region.asr,
                region.maghrib,
                region.isha,
                now.format("DD/MM/YYYY"),
            ],
        );

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
