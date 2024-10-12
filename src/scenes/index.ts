import { ScenesComposer } from "grammy-scenes";
import start from "#scenes/start.ts";
import location from "#scenes/location.ts";
import search from "#scenes/search.ts";
import notification from "#scenes/notification.ts";
import fasting from "#scenes/fasting.ts";
import statistic from "#scenes/statistic.ts";
import announcement from "#scenes/announcement.ts";
import donate from "#scenes/donate.ts";
import hadith from "#scenes/hadith.ts";
import source from "#scenes/source.ts";
import addHadith from "#scenes/add-hadith.ts";
import quran from "#scenes/quran.ts";
import feedback from "#scenes/feedback.ts";
import { BotContext } from "#types/context.ts";

export const scenes = new ScenesComposer<BotContext>(
    notification,
    search,
    announcement,
    statistic,
    location,
    fasting,
    start,
    donate,
    hadith,
    source,
    addHadith,
    quran,
    feedback,
);
