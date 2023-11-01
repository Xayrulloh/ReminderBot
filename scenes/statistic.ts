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
  keyboard.url(enterMessage, 'https://t.me/namoz5vbot')

  if (1151533771 === ctx.user.userId) {
    const blockedUsers = users.reduce((count, user) => {
      if (user.status === false) count++
      return count
    }, 0)

    shareMessage += `.\n\n Blocked users:  ${blockedUsers}\n Pure users:   ${users.length - blockedUsers}`
  }

  await ctx.reply(countMessage + users.length + '.\n\n' + shareMessage, { reply_markup: keyboard })
  ctx.scene.exit()
})

export default scene
