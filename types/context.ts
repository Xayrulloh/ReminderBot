import type { Context, InlineKeyboard, SessionFlavor } from "grammy";
import type { ScenesFlavor, ScenesSessionData } from "grammy-scenes";
import type { IGroup, IUser } from "#types/database";

interface AppSessionData {
	message: string;
	buttons: InlineKeyboard;
	regionIds: number[];
	selectedRegionId: number;
	currPage: number;
	keyboard: { view: string; text: string }[];
	keyboardMessage: string[];
	hadith: string;
	notificationSetting: Record<string, boolean>;
	setPrayerTimesMessage: Record<string, string>;
	prayerTimes: string[];
	isIndividual: boolean;
	toWhom: string;
}

type SessionData = ScenesSessionData & AppSessionData;

export type BotContext = Context &
	SessionFlavor<SessionData> &
	ScenesFlavor & {
		user: IUser;
		group?: IGroup;
	};
