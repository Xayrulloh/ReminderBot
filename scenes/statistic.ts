import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'
import { InlineKeyboard } from 'grammy'

const scene = new Scene<BotContext>('Statistic')

scene.step(async (ctx) => {
  const users = await Model.User.find<IUser>({ deletedAt: null })
  const countMessage = HLanguage('usersCount')
  let shareMessage = HLanguage('shareMessage')
  const keyboard = new InlineKeyboard()
  const enterMessage = HLanguage('enter')
  keyboard.url(enterMessage, 'https://t.me/' + ctx.me.username)

  if ([1151533771, 900604435, 962526857].includes(ctx.user.userId)) {
    let deletedUsers = 0
    const blockedUsers = users.reduce((count, user) => {
      if (user.status === false) count++
      if (user.deletedAt) deletedUsers++
      return count
    }, 0)

    shareMessage += `.\n\n Blocked users:  ${blockedUsers}\n Deleted account users: ${deletedUsers}\n Pure users:   ${
      users.length - blockedUsers
    }`
  }

  await ctx.reply(countMessage + users.length + '.\n\n' + shareMessage, { reply_markup: keyboard })
  ctx.scene.exit()
})

export default scene
