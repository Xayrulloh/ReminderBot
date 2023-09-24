import { Bot, MemorySessionStorage, session, webhookCallback } from 'grammy'
import 'dotenv/config'
import { scenes } from './scenes'
import HLanguage from '#helper/language'
import cron from 'node-cron'
import { daily, monthly, reminder, weekly } from './cron/cron'
import customKFunction from './keyboard/custom'
import express from 'express'
import { authMiddleware } from '#middlewares/auth'
import { keyboardMapper } from '#helper/keyboardMapper'
import { BotContext } from '#types/context'
import { WebhookClient, EmbedBuilder, bold, inlineCode } from 'discord.js'
import { env } from '#utils/env'

const token = String(env.token)
const bot = new Bot<BotContext>(token)

// crones
const scheduleOptions = {
  timezone: 'Asia/Tashkent',
}
const monthlyCron = cron.schedule(
  '30 0 1 * *',
  async () => {
    await monthly()
  },
  scheduleOptions,
)
const dailyCron = cron.schedule(
  '0 1 * * *',
  async () => {
    await daily(bot)
    await reminder(bot)
  },
  scheduleOptions,
)
const weeklyCron = cron.schedule(
  '0 13 * * 1',
  async () => {
    await weekly(bot)
  },
  scheduleOptions,
)

// middleware
bot.use(
  session({
    initial: () => ({}),
    storage: new MemorySessionStorage(Number(env.token)),
  }),
)
bot.use(scenes.manager())
bot.use(authMiddleware)
bot.use(scenes)

// Commands
bot.command('language', async (ctx) => {
  return ctx.scenes.enter('Language')
})

bot.command('notification', async (ctx) => {
  await ctx.scenes.enter('Notification')
})

bot.command('fasting', async (ctx) => {
  await ctx.scenes.enter('Fasting')
})

bot.command('start', async (ctx) => {
  const welcomeText = HLanguage(ctx.user.language, 'welcome')
  const keyboardText = HLanguage(ctx.user.language, 'mainKeyboard')
  const buttons = customKFunction(2, ...keyboardText)

  await ctx.reply(welcomeText, {
    reply_markup: {
      keyboard: buttons.build(),
      resize_keyboard: true,
    },
  })
})

bot.command('location', async (ctx) => {
  await ctx.scenes.enter('Location')
})

bot.command('search', async (ctx) => {
  await ctx.scenes.enter('Search')
})

bot.command('statistic', async (ctx) => {
  await ctx.scenes.enter('Statistic')
})

bot.command('advertise', async (ctx) => {
  await ctx.scenes.enter('Advertise')
})

bot.command('hadith', async (ctx) => {
  await ctx.scenes.enter('Hadith')
})

bot.on('message:text', async (ctx) => {
  const mappedScene = keyboardMapper(ctx.user.language, ctx.message.text)

  if (mappedScene) {
    return ctx.scenes.enter(mappedScene)
  }
})

// error handling
bot.catch(async (err) => {
  let embed = new EmbedBuilder()
    .setColor('Random')
    .setTitle(err.name)
    .setDescription(
      `
      ${bold('Stage:')} ${env.nodeEnv}
      ${bold('Id:')} ${inlineCode(String(err.ctx.from?.id))}
      ${bold('FirstName:')} ${err.ctx.from?.first_name}
      ${bold('LastName:')} ${err.ctx.from?.last_name}
      ${bold('Username:')} @${err.ctx.from?.username}
      ${bold('Message:')} ${err.message}
    `,
    )
    .setTimestamp(new Date())

  const discordClient = new WebhookClient({
    url: String(env.discordWebhookUrl),
  })

  await discordClient.send({
    threadId: String(env.discordThreadId),
    embeds: [embed],
  })
})

monthlyCron.start()
dailyCron.start()
weeklyCron.start()

reminder(bot)

// webhook
if (env.webhookEnabled) {
  const server = express()

  server.use(express.json())
  server.use(`/${token}`, webhookCallback(bot, 'express'))
  server.listen(env.webhookPort, async () => {
    await bot.api.setWebhook(env.webhookUrl + token)
  })
} else {
  bot
    .start({
      onStart: () => {
        console.info('Bot successfully started')
      },
    })
    .catch((e) => {
      console.error('Something went wrong!', e)
    })
}

// commented works

// bot.command('donate', async (ctx) => {
//   await ctx.scenes.enter('Donate')
// })
