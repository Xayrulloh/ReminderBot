import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { BotContext } from '#types/context'
import { IGroup, IUser } from '#types/database'
import { handleGroupSendMessageError, handleUserSendMessageError } from '#helper/errorHandler'
import { t } from '#config/i18n'
import inlineKFunction from '#keyboard/inline'
import { OWNER_ID } from '#utils/constants'

const scene = new Scene<BotContext>('Announcement')

scene.step(async (ctx) => {
  if (OWNER_ID === ctx.from?.id) {
    const message = t($ => $.announcementToWhom)
    const options = t($ => $.announcementOptions, { returnObjects: true })
    const keyboard = inlineKFunction(2, options)

    await ctx.reply(message, { reply_markup: keyboard, parse_mode: 'HTML' })
  } else {
    return ctx.scene.exit()
  }
})

scene.wait('individual_or_all').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.deleteMessage()

  const inputData = ctx.update.callback_query.data

  ctx.session.isIndividual = inputData === '1'

  if (ctx.session.isIndividual) {
    await ctx.reply("Qaysi userga jo'natish kerak")
  } else {
    await ctx.reply("Barchaga jo'natilishi kerak bo'lgan xabarni bering")
  }

  return ctx.scene.resume()
})

scene.wait('send-all_or_take-message').on('message:text', async (ctx) => {
  if (ctx.session.isIndividual) {
    if (isNaN(+ctx.message.text)) {
      await ctx.reply("Iltimos, qaysi userga jo'natish kerakligini yozing")

      return
    }

    ctx.session.toWhom = ctx.message.text

    await ctx.reply("Jo'natilishi kerak bo'lgan xabarni bering")

    return ctx.scene.resume()
  }

  const users = await Model.User.find<IUser>({ deletedAt: null, status: true })
  const groups = await Model.Group.find<IGroup>({ status: true })

  await ctx.reply("Xabar jo'natilmoqda")

  for (const group of groups) {
    await ctx.api
      .sendMessage(group.groupId, ctx.message.text, {
        entities: ctx.message.entities,
        reply_markup: ctx.message.reply_markup,
      })
      .catch(async (e) => await handleGroupSendMessageError(e, group))
  }

  for (const user of users) {
    await ctx.api
      .sendMessage(user.userId, ctx.message.text, {
        entities: ctx.message.entities,
        reply_markup: ctx.message.reply_markup,
      })
      .catch(async (e) => await handleUserSendMessageError(e, user))
  }

  await ctx.reply("Xabar jo'natildi")

  return ctx.scene.exit()
})

scene.wait('individual-message').on('message:text', async (ctx) => {
  const user = await Model.User.findOne<IUser>({ userId: +ctx.session.toWhom })

  if (!user) {
    await ctx.reply('User topilmadi')

    return ctx.scene.exit()
  }

  await ctx.api
    .sendMessage(user.userId, ctx.message.text, {
      entities: ctx.message.entities,
      reply_markup: ctx.message.reply_markup,
    })
    .catch(async (e) => await handleUserSendMessageError(e, user))

  await ctx.reply("Xabar jo'natildi")

  return ctx.scene.exit()
})

export default scene
