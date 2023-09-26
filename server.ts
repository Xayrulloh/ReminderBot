import { Bot, BotError, MemorySessionStorage, session, webhookCallback } from 'grammy'
import { scenes } from './scenes'
import HLanguage from '#helper/language'
import cron from 'node-cron'
import { daily, monthly, reminder, weekly } from './cron/cron'
import customKFunction from './keyboard/custom'
import express from 'express'
import { authMiddleware } from '#middlewares/auth'
import { keyboardMapper } from '#helper/keyboardMapper'
import { BotContext } from '#types/context'
import { env } from '#utils/env'
import { Color } from '#utils/enums'
import { errorHandler } from '#helper/errorHandler'
import { HttpStatusCode } from 'axios'

const bot = new Bot<BotContext>(env.TOKEN)

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
    storage: new MemorySessionStorage(env.SESSION_TTL),
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
bot.catch(errorHandler)

monthlyCron.start()
dailyCron.start()
weeklyCron.start()

reminder(bot)

// webhook
if (env.WEBHOOK_ENABLED) {
  const server = express()

  server.use(express.json())
  server.use(`/${env.TOKEN}`, async (req, res, next) => {
    try {
      await webhookCallback(bot, 'express')(req, res, next)
    } catch (e) {
      if (e instanceof BotError) {
        await errorHandler(e)
      } else {
        console.error(e)
      }

      res.status(HttpStatusCode.Ok).json({ success: false })
    }
  })
  server.listen(env.WEBHOOK_PORT, async () => {
    await bot.api.setWebhook(env.WEBHOOK_URL + env.TOKEN)
  })
} else {
  bot
    .start({
      onStart: () => {
        console.info('Bot successfully started')
      },
    })
    .catch((e) => {
      console.error(Color.Red, 'Something went wrong!', e)
      process.exit()
    })
}

// commented works

// bot.command('donate', async (ctx) => {
//   await ctx.scenes.enter('Donate')
// })
