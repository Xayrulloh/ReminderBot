import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { t } from '#config/i18n'
import regionsData from '#config/regions.json'
import { memoryStorage } from '#config/storage'
import inlineKFunction from '#keyboard/inline'
import type { BotContext } from '#types/context'
import type { IGroup } from '#types/database'
import { DAILY_QURAN_KEY } from '#utils/constants'
import dayjs from '#utils/dayjs'
import { getPrayerTimes, getRegionIds } from '#utils/prayerTimes'

const regionsById = getRegionIds()
const REGION_KEYBOARD = regionsData.map((r) => ({
  view: r.name,
  text: String(r.id),
}))

function getLocationMessage(ctx: BotContext) {
  return `${t(($) => $.currentRegion)} <b>${ctx.group?.region}</b>\n\n ${t(($) => $.chooseRegion)}`
}

const scene = new Scene<BotContext>('GroupLocation')

scene.step(async (ctx) => {
  const message = getLocationMessage(ctx)
  const buttons = inlineKFunction(3, REGION_KEYBOARD)

  ctx.session.currPage = 1

  await ctx.reply(message, { reply_markup: buttons, parse_mode: 'HTML' })
})

scene.wait('group_location_update').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update.callback_query.data

  if (regionsById.has(+inputData) || ['<', '>', 'pageNumber'].includes(inputData)) {
    if (['<', '>', 'pageNumber'].includes(inputData)) {
      if (inputData === '<' && ctx.session.currPage !== 1) {
        await ctx.answerCallbackQuery()

        const buttons = inlineKFunction(3, REGION_KEYBOARD, --ctx.session.currPage)

        await ctx.editMessageText(getLocationMessage(ctx), {
          reply_markup: buttons,
          parse_mode: 'HTML',
        })
      } else if (inputData === '>' && ctx.session.currPage * 12 < regionsById.size) {
        await ctx.answerCallbackQuery()

        const buttons = inlineKFunction(3, REGION_KEYBOARD, ++ctx.session.currPage)

        await ctx.editMessageText(getLocationMessage(ctx), {
          reply_markup: buttons,
          parse_mode: 'HTML',
        })
      } else {
        await ctx.answerCallbackQuery(t(($) => $.wrongSelection))
      }
    } else {
      await ctx.answerCallbackQuery()

      const now = dayjs()
      const data = getPrayerTimes(+inputData, now.toDate())
      if (!data || !ctx.chat) return ctx.scene.exit()

      const regionName = regionsData.find((r) => r.id === data.regionId)?.name ?? ''

      const updatedGroup = await Model.Group.findOneAndUpdate<IGroup>(
        { groupId: ctx.chat.id },
        { region: regionName, regionId: +inputData },
        { new: true },
      )

      if (updatedGroup) {
        ctx.group = updatedGroup

        memoryStorage.write(String(ctx.chat.id), updatedGroup)
      }

      const response = t(($) => $.infoPrayTime, {
        region: data.region,
        fajr: data.fajr,
        sunrise: data.sunrise,
        dhuhr: data.dhuhr,
        asr: data.asr,
        maghrib: data.maghrib,
        isha: data.isha,
        date: now.format('DD/MM/YYYY'),
      })
      const dailyQuran = memoryStorage.read(DAILY_QURAN_KEY) ?? String()
      const locationMessage = t(($) => $.locationChange)

      await ctx.editMessageText(`${locationMessage}\n\n${response}${dailyQuran}`, {
        parse_mode: 'HTML',
      })

      ctx.scene.exit()
    }
  } else {
    await ctx.answerCallbackQuery(t(($) => $.wrongSelection))
  }
})

export default scene
