import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { BotContext } from '#types/context'
import { IUser, IGroup } from '#types/database'
import { InlineKeyboard } from 'grammy'

const scene = new Scene<BotContext>('Statistic')

scene.step(async (ctx) => {
  const users = await Model.User.find<IUser>()
  const groups = await Model.Group.find<IGroup>({ status: true })
  const countMessage = HLanguage('usersCount')
  let shareMessage = HLanguage('shareMessage')
  const keyboard = new InlineKeyboard()
  const enterMessage = HLanguage('enter')

  let groupUsersCount = 0

  for (const group of groups) {
    try {
      const data = await ctx.api.getChatMemberCount(group.groupId)

      groupUsersCount += data
    } catch (e) {
      console.error(`Failed to get member count for group ${group.groupId}:`, e)
    }
  }

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

  await ctx.reply(countMessage + users.length + '.\n\n' + 'Guruhlardagi azolar: ' + groupUsersCount + '.\n\n' + shareMessage, { reply_markup: keyboard })

  ctx.scene.exit()
})

export default scene
