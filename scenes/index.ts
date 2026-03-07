import { ScenesComposer } from "grammy-scenes";
import type { BotContext } from "#types/context";
import addHadith from "./add-hadith";
import announcement from "./announcement";
import donate from "./donate";
import fasting from "./fasting";
import feedback from "./feedback";
import groupLocation from "./group-location";
import groupStart from "./group-start";
import hadith from "./hadith";
import location from "./location";
import notification from "./notification";
import quran from "./quran";
import search from "./search";
import source from "./source";
import start from "./start";
import statistic from "./statistic";

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
	groupStart,
	groupLocation,
);
