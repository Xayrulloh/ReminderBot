import { Bot, session } from 'grammy'
import 'dotenv/config'
import Model from '#config/database'
import { scenes } from './scenes/index.js'
import HLanguage from '#helper/language'
import cron from 'node-cron'
import { daily, monthly, reminder, weekly } from './cron/cron.js'
import { inlineQuery } from './query/inline.js'
import express from "express"

const token = process.env.TOKEN
const bot = new Bot(token)

const PORT = process.env?.PORT || 3600
const server = express()
server.use( express.json() )
server.post(`/${token}`, (req, res) => {
  const { body } = req;
  bot.processUpdate(body);
  res.sendStatus(200);
});

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
bot.inlineQuery(/(.*)/gi, async (ctx) => {
  const userId = ctx.update.inline_query.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.inline_query.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  inlineQuery(ctx)
})
bot.use(session({ initial: () => ({}) }))
bot.use(scenes.manager())
bot.use(scenes)

// Commands
bot.command('language', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  return ctx.scenes.enter('Language')
})

bot.command('notification', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  await ctx.scenes.enter('Notification')
})

bot.command('fasting', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  await ctx.scenes.enter('Fasting')
})

bot.command('start', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')
})

bot.command('location', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  await ctx.scenes.enter('Location')
})

// bot.command('donate', async (ctx) => {
//   const userId = ctx.update.message.from.id
//   const user = await Model.User.findOne({ userId })

//   if (ctx.update.message.from.is_bot) return
//   if (!user) return ctx.scenes.enter('Start')

//   await ctx.scenes.enter('Donate')
// })

bot.command('search', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  await ctx.scenes.enter('Search')
})

bot.command('statistic', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  await ctx.scenes.enter('Statistic')
})

bot.command('advertise', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  await ctx.scenes.enter('Advertise')
})

bot.command('hadith', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  await ctx.scenes.enter('Hadith')
})

bot.on('message:text', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  const keyboardText = HLanguage(user.language, 'mainKeyboard')

  if (ctx.message.text === keyboardText[0]) ctx.scenes.enter('Search')
  if (ctx.message.text === keyboardText[1]) ctx.scenes.enter('Language')
  if (ctx.message.text === keyboardText[2]) ctx.scenes.enter('Location')
  if (ctx.message.text === keyboardText[3]) ctx.scenes.enter('Fasting')
  if (ctx.message.text === keyboardText[4]) ctx.scenes.enter('Notification')
  if (ctx.message.text === keyboardText[5]) ctx.scenes.enter('Statistic')
  // if (ctx.message.text === keyboardText[6]) ctx.scenes.enter('Donate')
})

bot.on('callback_query', async (ctx) => {
  const userId = ctx.callbackQuery.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.callbackQuery.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')
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

// bot.start()
monthlyCron.start()
dailyCron.start()
// weeklyCron.start()

reminder(bot)

bot.api.setWebhook('https://reposu.org/xayrullohbot/' + token)
server.listen(PORT, () => console.log("TelegramBot Webhook started: ", PORT))
export default bot
