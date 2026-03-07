import { format } from "node:util";
import { autoRetry } from "@grammyjs/auto-retry";
import { EmbedBuilder, WebhookClient } from "discord.js";
import Fastify from "fastify";
import { Bot, MemorySessionStorage, session, webhookCallback } from "grammy";
import Model from "#config/database";
import { t } from "#config/i18n";
import { memoryStorage } from "#config/storage";
import {
	errorHandler,
	handleGroupSendMessageError,
} from "#helper/errorHandler";
import { keyboardMapper } from "#helper/keyboardMapper";
import { groupAuthMiddleware, userAuthMiddleware } from "#middlewares/auth";
import { inlineQuery } from "#query/inline";
import type { BotContext } from "#types/context";
import type { IGroup } from "#types/database";
import { FLOOD_MESSAGE } from "#utils/constants";
import { Color } from "#utils/enums";
import { env } from "#utils/env";
import { cronStarter } from "./cron/cron";
import customKFunction from "./keyboard/custom";
import { scenes } from "./scenes";

const bot = new Bot<BotContext>(env.TOKEN);

// plugins
bot.api.config.use(
	autoRetry({
		maxDelaySeconds: 1,
		maxRetryAttempts: 3,
	}),
);

// middleware
bot.use(
	session({
		initial: () => ({}) as BotContext["session"],
		storage: new MemorySessionStorage(env.SESSION_TTL),
	}),
);
bot.use(scenes.manager());

const privateChatBot = bot.chatType("private");
const groupChatBot = bot.chatType(["group", "supergroup"]);

// Inline Query
bot.on("inline_query", async (ctx) => {
	await inlineQuery(ctx);
});

privateChatBot.use(userAuthMiddleware);
privateChatBot.use(scenes);

groupChatBot.use(groupAuthMiddleware);
groupChatBot.use(scenes);

// Private chat commands
privateChatBot.command(
	[
		"notification",
		"fasting",
		"location",
		"search",
		"statistic",
		"announcement",
		"hadith",
		"addHadith",
		"quran",
		"source",
		"feedback",
	],
	async (ctx) => {
		const command = ctx.message?.text?.split(" ")[0].substring(1);

		if (command) {
			const sceneName = command.charAt(0).toUpperCase() + command.slice(1);

			await ctx.scenes.enter(sceneName);
		}
	},
);

privateChatBot.command("start", async (ctx) => {
	const welcomeText = t(($) => $.welcome);
	const keyboardText = t(($) => $.mainKeyboard, { returnObjects: true });
	const buttons = customKFunction(2, ...keyboardText);

	if (!ctx.user.status) {
		await Model.User.updateOne(
			{ userId: ctx.user.userId },
			{ status: true },
			{},
		);
	}

	await ctx.reply(welcomeText, {
		reply_markup: {
			keyboard: buttons.build(),
			resize_keyboard: true,
		},
	});
});

privateChatBot.on("message:text", async (ctx) => {
	const mappedScene = keyboardMapper(ctx.message.text);

	if (mappedScene) {
		return ctx.scenes.enter(mappedScene);
	} else {
		const discordClient = new WebhookClient({
			url: env.DISCORD_WEBHOOK_URL,
		});

		const embed = new EmbedBuilder()
			.setColor("Blue")
			.setTitle(`**ID:** ${ctx.from.id}`)
			.setDescription(
				format(
					FLOOD_MESSAGE,
					env.NODE_ENV,
					ctx.from.username,
					ctx.from.first_name,
					ctx.from.last_name,
					ctx.message.text,
				),
			)
			.setTimestamp(new Date());

		await discordClient.send({
			threadId: env.DISCORD_FLOOD_THREAD_ID,
			embeds: [embed],
		});
	}
});

// Group chat commands
groupChatBot.command("start", async (ctx) => {
	const registeredText = t(($) => $.botRegistered);

	if (!ctx.group?.status) {
		const updatedGroup = await Model.Group.findOneAndUpdate<IGroup>(
			{ groupId: ctx.chat.id },
			{ status: true },
			{ new: true },
		);

		if (updatedGroup) {
			ctx.group = updatedGroup;

			memoryStorage.write(String(ctx.chat?.id), updatedGroup);
		}
	}

	await ctx.reply(registeredText).catch((e) => {
		if (ctx.group) {
			handleGroupSendMessageError(e, ctx.group);
		} else {
			console.error(e);
		}
	});
});

groupChatBot.command("location", async (ctx) => {
	await ctx.scenes.enter("GroupLocation");
});

bot.on("my_chat_member", async (ctx) => {
	if (ctx.myChatMember.new_chat_member.status === "member") {
		await ctx.scenes.enter("GroupStart");
	} else if (
		["left", "kicked"].includes(ctx.myChatMember.new_chat_member.status)
	) {
		await Model.Group.updateOne({ groupId: ctx.chat.id }, { status: false });
	}
});

// error handling
bot.catch(errorHandler);

void cronStarter(bot);

// webhook
if (env.WEBHOOK_ENABLED) {
	const server = Fastify();

	server.post(`/${env.TOKEN}`, webhookCallback(bot, "fastify"));
	server.setErrorHandler(errorHandler);
	server.listen({ port: env.WEBHOOK_PORT }, async () => {
		await bot.api.setWebhook(env.WEBHOOK_URL + env.TOKEN);

		// Delete commands before setting new ones
		await bot.api.deleteMyCommands({ scope: { type: "all_group_chats" } });

		// Set commands for private chats
		await bot.api.setMyCommands(
			[
				{ command: "start", description: "Botni ishga tushirish" },
				{ command: "search", description: "Qidirish" },
				{ command: "location", description: "Joylashuvni o`zgartirish" },
				{ command: "fasting", description: "Ro`za" },
				{
					command: "notification",
					description: "Ogohlantirishni o`zgartirish",
				},
				{ command: "statistic", description: "Statistika" },
				{ command: "source", description: "Manba" },
				{ command: "hadith", description: "Hadis" },
				{ command: "quran", description: "Qur`on va Tafsiri" },
				{ command: "feedback", description: "Taklif yoki shikoyat" },
			],
			{ scope: { type: "all_private_chats" } },
		);

		// Set commands for group chats
		await bot.api.setMyCommands(
			[
				{ command: "start", description: "Botni ishga tushirish" },
				{ command: "location", description: "Joylashuvni o`zgartirish" },
			],
			{ scope: { type: "all_group_chats" } },
		);
	});
} else {
	bot
		.start({
			onStart: async () => {
				console.info("Bot successfully started");

				// Delete commands before setting new ones
				await bot.api.deleteMyCommands({ scope: { type: "all_group_chats" } });

				// Set commands for private chats
				await bot.api.setMyCommands(
					[
						{ command: "start", description: "Botni ishga tushirish" },
						{ command: "search", description: "Qidirish" },
						{ command: "location", description: "Joylashuvni o`zgartirish" },
						{ command: "fasting", description: "Ro`za" },
						{
							command: "notification",
							description: "Ogohlantirishni o`zgartirish",
						},
						{ command: "statistic", description: "Statistika" },
						{ command: "source", description: "Manba" },
						{ command: "hadith", description: "Hadis" },
						{ command: "quran", description: "Qur`on va Tafsiri" },
						{ command: "feedback", description: "Taklif yoki shikoyat" },
					],
					{ scope: { type: "all_private_chats" } },
				);

				// Set commands for group chats
				await bot.api.setMyCommands(
					[
						{ command: "start", description: "Botni ishga tushirish" },
						{ command: "location", description: "Joylashuvni o`zgartirish" },
					],
					{ scope: { type: "all_group_chats" } },
				);
			},
		})
		.catch((e) => {
			console.error(Color.Red, "Something went wrong!", e);
			process.exit();
		});
}

// commented works

// bot.command('donate', async (ctx) => {
//   await ctx.scenes.enter('Donate')
// })
