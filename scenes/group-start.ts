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

const scene = new Scene<BotContext>('GroupStart')

scene.step(async (ctx) => {
  const buttons = inlineKFunction(3, REGION_KEYBOARD)

  ctx.session.currPage = 1

  await ctx.reply(
    t(($) => $.chooseRegion),
    { reply_markup: buttons },
  )
})

scene.wait('group_location').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update.callback_query.data

  if (regionsById.has(+inputData) || ['<', '>', 'pageNumber'].includes(inputData)) {
    if (['<', '>', 'pageNumber'].includes(inputData)) {
      if (inputData === '<' && ctx.session.currPage !== 1) {
        await ctx.answerCallbackQuery()

        const buttons = inlineKFunction(3, REGION_KEYBOARD, --ctx.session.currPage)

        await ctx.editMessageText(
          t(($) => $.chooseRegion),
          {
            reply_markup: buttons,
            parse_mode: 'HTML',
          },
        )
      } else if (inputData === '>' && ctx.session.currPage * 12 < regionsById.size) {
        await ctx.answerCallbackQuery()

        const buttons = inlineKFunction(3, REGION_KEYBOARD, ++ctx.session.currPage)

        await ctx.editMessageText(
          t(($) => $.chooseRegion),
          {
            reply_markup: buttons,
            parse_mode: 'HTML',
          },
        )
      } else {
        await ctx.answerCallbackQuery(t(($) => $.wrongSelection))
      }
    } else {
      await ctx.answerCallbackQuery()

      const now = dayjs()
      const data = getPrayerTimes(+inputData, now)
      if (!data || !ctx.chat) return ctx.scene.exit()

      const regionName = regionsData.find((r) => r.id === data.regionId)?.name ?? ''

      const updatedGroup = await Model.Group.findOneAndUpdate<IGroup>(
        { groupId: ctx.chat.id },
        {
          groupId: ctx.chat.id,
          groupName: 'title' in ctx.chat ? ctx.chat.title : 'Unknown Group',
          region: regionName,
          regionId: data.regionId,
          status: true,
          type: ctx.chat?.type,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )

      if (updatedGroup) {
        ctx.group = updatedGroup

        memoryStorage.write(String(ctx.chat?.id), updatedGroup)
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

      await ctx.deleteMessage()
      await ctx.reply(response + dailyQuran, {
        parse_mode: 'HTML',
      })

      ctx.scene.exit()
    }
  } else {
    await ctx.answerCallbackQuery(t(($) => $.wrongSelection))
  }
})

export default scene
