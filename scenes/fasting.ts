import { Scene } from "grammy-scenes";
import Model from "#config/database";
import { t } from "#config/i18n";
import inlineKFunction from "#keyboard/inline";
import type { BotContext } from "#types/context";
import type { IUser } from "#types/database";

const scene = new Scene<BotContext>("Fasting");

scene.step(async (ctx) => {
	const keyboardMessage = t(($) => $.agreementFasting, { returnObjects: true });
	const buttons = inlineKFunction(Infinity, [
		{ view: keyboardMessage[0], text: keyboardMessage[0] },
		{ view: keyboardMessage[1], text: keyboardMessage[1] },
	]);

	await ctx.reply(t(($) => $.fastingMessage), { reply_markup: buttons });
});

scene.wait("fasting").on("callback_query:data", async (ctx) => {
	const keyboardMessage = t(($) => $.agreementFasting, { returnObjects: true });

	if ((keyboardMessage as string[]).includes(ctx.update.callback_query.data)) {
		await ctx.answerCallbackQuery();

		const fasting = keyboardMessage[0] === ctx.update.callback_query.data;

		await Model.User.updateOne<IUser>({ userId: ctx.user.userId }, { fasting });

		await ctx.editMessageText(t(($) => $.notifChange));
		ctx.scene.exit();
	} else {
		await ctx.answerCallbackQuery(t(($) => $.wrongSelection));
	}
});

export default scene;
