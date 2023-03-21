import { Bot, session } from 'grammy'
import 'dotenv/config'
import Model from '#config/database'
import { scenes } from './scenes/index.js'

const token = process.env.TOKEN
const bot = new Bot(token)

// middleware
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

// error handling
// bot.catch((err) => {
//   const ctx = err.ctx
//   const error = err.error
//   const name = err.name

//   const response = `By: ${ctx.update.message.from.id}\nUsername: @${ctx.update.message.from.username}\nError: ${name}\nError message: ${error.message}`

//   bot.api.sendMessage(1151533771, response)
// })

bot.start()

// Heart();
