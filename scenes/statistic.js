import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import HLanguage from '#helper/language'

const scene = new Scene('Statistic')

scene.do(async (ctx) => {
  const users = await Model.User.find()
  const countMessage = HLanguage(ctx.user.language, 'usersCount')
  let shareMessage = HLanguage(ctx.user.language, 'shareMessage')

  if (1151533771 == ctx.user.userId) {
    const blockedUsers = users.reduce((count, user) => {
      if (user.status === false) count++
      return count
    }, 0)

    shareMessage += `.\n\n Blocked users:  ${blockedUsers}\n Pure users:   ${users.length - blockedUsers}`
  }

  ctx.reply(countMessage + users.length + '.\n\n' + shareMessage)
  ctx.scene.exit()
})

export default scene
