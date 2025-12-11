import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'
import { InlineKeyboard } from 'grammy'

const scene = new Scene<BotContext>('Statistic')

scene.step(async (ctx) => {
  const users = await Model.User.find<IUser>()
  const countMessage = HLanguage('usersCount')
  let shareMessage = HLanguage('shareMessage')
  const keyboard = new InlineKeyboard()
  const enterMessage = HLanguage('enter')

  keyboard.url(enterMessage, 'https://t.me/' + ctx.me.username)

  if ([1151533771, 900604435, 962526857].includes(ctx.user.userId)) {
    const usersInfo = users.reduce(
      (userObj, user) => {
        if (user.status === false && !user.deletedAt) ++userObj.blockedUsers
        if (user.deletedAt) ++userObj.deletedUsers

        return userObj
      },
      { blockedUsers: 0, deletedUsers: 0 },
    )

    shareMessage += `.\n\n Blocked users:  ${usersInfo.blockedUsers}\n Deleted account users: ${
      usersInfo.deletedUsers
    }\n Pure users:   ${users.length - (usersInfo.blockedUsers + usersInfo.deletedUsers)}`
  }

  await ctx.reply(countMessage + users.length + '.\n\n' + shareMessage, { reply_markup: keyboard })

  ctx.scene.exit()
})

export default scene
