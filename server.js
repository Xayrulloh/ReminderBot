import { Bot, session, webhookCallback } from 'grammy'
import 'dotenv/config'
import { scenes } from './scenes/index.js'
import HLanguage from '#helper/language'
import cron from 'node-cron'
import { daily, monthly, reminder, weekly } from './cron/cron.js'
import customKFunction from './keyboard/custom.js'
import express from 'express'
import { keyboardMapper } from '#helper/keyboardMapper'
import { authMiddleware } from '#middlewares/auth'

const token = process.env.TOKEN
const bot = new Bot(token)

// crones
const monthlyCron = cron.schedule('30 0 1 * *', async () => {
  await monthly()
})
const dailyCron = cron.schedule('0 1 * * *', async () => {
  await daily(bot)
  await reminder(bot)
})
const weeklyCron = cron.schedule('0 13 * * 1', async () => {
  await weekly(bot)
})

// middleware
bot.use(session({ initial: () => ({}) }))
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

// bot.command('donate', async (ctx) => {
//   await ctx.scenes.enter('Donate')
// })

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

  ctx.reply(HLanguage(user.language, 'wrongSelection'))
})

// error handling
bot.catch((err) => {
  let { message, inline_query, callback_query } = err.ctx.update

  let response = ''

  if (message) {
    response = `Id: ${message.from.id}\nUsername: @${message.from.username}\nName: ${message.from.first_name}\nError: ${err.message}`
  } else if (inline_query) {
    response = `Id: ${inline_query.from.id}\nUsername: @${inline_query.from.username}\nName: ${inline_query.from.first_name}\nError: ${err.message}`
  } else if (callback_query) {
    response = `Id: ${callback_query.from.id}\nUsername: @${callback_query.from.username}\nName: ${callback_query.from.first_name}\nError: ${err.message}`
  }

  bot.api.sendMessage(1151533771, response)
})

monthlyCron.start()
dailyCron.start()
// weeklyCron.start()

reminder(bot)

// webhook
if (process.env.NODE_ENV === 'dev') {
  bot.start()
} else {
  const PORT = process.env?.PORT || 3600
  const server = express()
  server.use(express.json())
  server.use(`/${token}`, webhookCallback(bot, 'express'))
  server.listen(PORT, async () => {
    await bot.api.setWebhook('https://reposu.org/xayrullohbot/' + token)
  })
}
