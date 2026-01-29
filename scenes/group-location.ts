import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import { BotContext } from '#types/context'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IPrayTime, IGroup } from '#types/database'
import dayjs from '#utils/dayjs'

const scene = new Scene<BotContext>('GroupLocation')

scene.step(async (ctx) => {
  const message = `${HLanguage('currentRegion')} <b>${ctx.group?.region}</b>\n\n ${HLanguage('chooseRegion')}`
  const keyboardMessage = HLanguage('region')
  const keyboard = []

  for (let region in keyboardMessage) {
    keyboard.push({ view: region, text: keyboardMessage[region] })
  }

  const buttons = inlineKFunction(3, keyboard)

  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.regionId = Object.values(keyboardMessage)
  ctx.session.regions = keyboardMessage
  ctx.session.currPage = 1
  ctx.session.keyboard = keyboard

  await ctx.reply(message, { reply_markup: buttons, parse_mode: 'HTML' })
})

scene.wait('group_location_update').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update.callback_query.data

  if (ctx.session.regionId.includes(+inputData) || ['<', '>'].includes(inputData)) {
    if (['<', '>', 'pageNumber'].includes(inputData)) {
      if (inputData == '<' && ctx.session.currPage != 1) {
        await ctx.answerCallbackQuery()

        ctx.session.buttons = inlineKFunction(3, ctx.session.keyboard, --ctx.session.currPage)

        await ctx.editMessageText(ctx.session.message, { reply_markup: ctx.session.buttons, parse_mode: 'HTML' })
      } else if (inputData == '>' && ctx.session.currPage * 12 <= ctx.session.regionId.length) {
        await ctx.answerCallbackQuery()

        ctx.session.buttons = inlineKFunction(3, ctx.session.keyboard, ++ctx.session.currPage)

        await ctx.editMessageText(ctx.session.message, { reply_markup: ctx.session.buttons, parse_mode: 'HTML' })
      } else {
        await ctx.answerCallbackQuery(HLanguage('wrongSelection'))
      }
    } else {
      await ctx.answerCallbackQuery()

      const now = dayjs()
      const today = now.get('date')
      const currentMonth = now.get('month') + 1
      const message = HLanguage('infoPrayTime')
      const data = await Model.PrayTime.findOne<IPrayTime>({ day: today, regionId: +inputData, month: currentMonth })
      let regionName = ''

      if (!data) return ctx.scene.exit()

      for (const key in ctx.session.regions) {
        if (ctx.session.regions[key] === data.regionId) {
          regionName = key
          break
        }
      }

      const updatedGroup = await Model.Group.findOneAndUpdate<IGroup>(
        { groupId: ctx.chat!.id },
        { region: regionName, regionId: +inputData },
        { new: true },
      )

      if (updatedGroup) {
        ctx.group = updatedGroup

        memoryStorage.write(String(ctx.chat!.id), updatedGroup)
      }

      let response = HReplace(
        message,
        ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha', '$date'],
        [data.region, data.fajr, data.sunrise, data.dhuhr, data.asr, data.maghrib, data.isha, now.format('DD/MM/YYYY')],
      )
      const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String()
      const locationMessage = HLanguage('locationChange')

      await ctx.editMessageText(locationMessage + '\n\n' + response + dailyHadith, {
        parse_mode: 'HTML',
      })

      ctx.scene.exit()
    }
  } else {
    await ctx.answerCallbackQuery(HLanguage('wrongSelection'))
  }
})

export default scene
