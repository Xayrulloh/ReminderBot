import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import HLanguage from '#helper/language'

const scene = new Scene('Statistic')

scene.do(async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ id: userId })
  const users = await Model.User.find()
  const language = user.language
  const countMessage = HLanguage(language, 'usersCount')
  const shareMessage = HLanguage(language, 'shareMessage')

  ctx.reply(countMessage + users.length + '.\n\n' + shareMessage)
  ctx.scene.exit()
})

export default scene
