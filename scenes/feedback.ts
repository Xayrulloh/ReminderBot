import { format } from "node:util";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { Scene } from "grammy-scenes";
import { t } from "#config/i18n";
import customKFunction from "#keyboard/custom";
import type { BotContext } from "#types/context";
import { FEEDBACK_MESSAGE } from "#utils/constants";
import { env } from "#utils/env";

const scene = new Scene<BotContext>("Feedback");

scene.step(async (ctx) => {
	const message = t(($) => $.feedbackStartMessage);

	await ctx.reply(message);
});

scene.wait("feedbackStart").on("message:text", async (ctx) => {
	const message = t(($) => $.feedbackEndMessage);

	const discordClient = new WebhookClient({
		url: env.DISCORD_WEBHOOK_URL,
	});

	const embed = new EmbedBuilder()
		.setColor("Green")
		.setTitle(`**ID:** ${ctx.from.id}`)
		.setDescription(
			format(
				FEEDBACK_MESSAGE,
				env.NODE_ENV,
				ctx.from.username,
				ctx.from.first_name,
				ctx.from.last_name,
				ctx.message.text,
			),
		)
		.setTimestamp(new Date());

	await discordClient.send({
		threadId: env.DISCORD_FEEDBACK_THREAD_ID,
		embeds: [embed],
	});

	const keyboardText = t(($) => $.mainKeyboard, { returnObjects: true });
	const buttons = customKFunction(2, ...keyboardText);

	await ctx.reply(message, {
		reply_markup: {
			keyboard: buttons.build(),
			resize_keyboard: true,
		},
	});

	ctx.scene.exit();
});

export default scene;
