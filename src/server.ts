import { Bot, MemorySessionStorage, session, webhookCallback } from "grammy";
import { scenes } from "#scenes/index.ts";
import HLanguage from "#helper/language.ts";
import { cronStarter } from "./cron/cron.ts";
import customKFunction from "#keyboard/custom.ts";
import { authMiddleware } from "#middlewares/auth.ts";
import { keyboardMapper } from "#helper/keyboardMapper.ts";
import { BotContext } from "#types/context.ts";
import { env } from "#utils/env.ts";
import { Color } from "#utils/enums.ts";
import { errorHandler } from "#helper/errorHandler.ts";
import { autoRetry } from "@grammyjs/auto-retry";
import Model from "#config/database.ts";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { format } from "node:util";
import { FLOOD_MESSAGE } from "#utils/constants.ts";

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
    initial: () => ({}),
    storage: new MemorySessionStorage(env.SESSION_TTL),
  }),
);
bot.use(scenes.manager());
bot.use(authMiddleware);
bot.use(scenes);

// Commands
bot.command("notification", async (ctx) => {
  await ctx.scenes.enter("Notification");
});

bot.command("fasting", async (ctx) => {
  await ctx.scenes.enter("Fasting");
});

bot.command("location", async (ctx) => {
  await ctx.scenes.enter("Location");
});

bot.command("search", async (ctx) => {
  await ctx.scenes.enter("Search");
});

bot.command("statistic", async (ctx) => {
  await ctx.scenes.enter("Statistic");
});

bot.command("announcement", async (ctx) => {
  await ctx.scenes.enter("Announcement");
});

bot.command("hadith", async (ctx) => {
  await ctx.scenes.enter("Hadith");
});

bot.command("addHadith", async (ctx) => {
  await ctx.scenes.enter("AddHadith");
});

bot.command("quran", async (ctx) => {
  await ctx.scenes.enter("Quran");
});

bot.command("start", async (ctx) => {
  const welcomeText = HLanguage("welcome");
  const keyboardText = HLanguage("mainKeyboard");
  const buttons = customKFunction(2, ...keyboardText);

  if (!ctx.user.status) {
    await Model.User.updateOne({ userId: ctx.user.userId }, {
      status: true,
    }, {});
  }

  await ctx.reply(welcomeText, {
    reply_markup: {
      keyboard: buttons.build(),
      resize_keyboard: true,
    },
  });
});

bot.command("source", async (ctx) => {
  await ctx.scenes.enter("Source");
});

bot.command("feedback", async (ctx) => {
  await ctx.scenes.enter("Feedback");
});

bot.on("message:text", async (ctx) => {
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

// error handling
bot.catch(errorHandler);

void cronStarter(bot);

// webhook
if (env.WEBHOOK_ENABLED) {
  const secretToken = env.TOKEN.split(":")[1];
  Deno.serve(
    {
      port: env.WEBHOOK_PORT,
      onListen: async (addr) => {
        await bot.api.setWebhook(env.WEBHOOK_URL as string, {
          secret_token: secretToken,
        });
        console.info(
          `Webhook server is listening on [${addr.hostname}:${addr.port}]`,
        );
      },
    },
    webhookCallback(bot, "std/http", { secretToken }),
  );
} else {
  bot
    .start({
      onStart: () => {
        console.info("Bot successfully started");
      },
    })
    .catch((e) => {
      console.error(Color.Red, "Something went wrong!", e);
      Deno.exit();
    });
}

// commented works

// bot.command('donate', async (ctx) => {
//   await ctx.scenes.enter('Donate')
// })
