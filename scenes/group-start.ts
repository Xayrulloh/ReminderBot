import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import { t } from '#config/i18n'
import { regions } from '#config/regions'
import { BotContext } from '#types/context'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IGroup } from '#types/database'
import { getPrayerTimes } from '#utils/prayerTimes'
import dayjs from '#utils/dayjs'

const scene = new Scene<BotContext>('GroupStart')

scene.step(async (ctx) => {
  const message = t($ => $.chooseRegion)
  const keyboard = []

  for (let region in regions) {
    keyboard.push({ view: region, text: String(regions[region]) })
  }

  const buttons = inlineKFunction(3, keyboard)

  ctx.session.message = message
  ctx.session.buttons = buttons
  ctx.session.regionId = Object.values(regions)
  ctx.session.regions = regions
  ctx.session.currPage = 1
  ctx.session.keyboard = keyboard

  await ctx.reply(message, { reply_markup: buttons })
})

scene.wait('group_location').on('callback_query:data', async (ctx) => {
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
        await ctx.answerCallbackQuery(t($ => $.wrongSelection))
      }
    } else {
      await ctx.answerCallbackQuery()

      const now = dayjs()
      const data = getPrayerTimes(+inputData, now.toDate())
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
        {
          groupId: ctx.chat!.id,
          groupName: 'title' in ctx.chat! ? ctx.chat.title : 'Unknown Group',
          region: regionName,
          regionId: data.regionId,
          status: true,
          type: ctx.chat!.type,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )

      if (updatedGroup) {
        ctx.group = updatedGroup

        memoryStorage.write(String(ctx.chat!.id), updatedGroup)
      }

      const response = t($ => $.infoPrayTime, {
        region: data.region,
        fajr: data.fajr,
        sunrise: data.sunrise,
        zuhr: data.dhuhr,
        asr: data.asr,
        maghrib: data.maghrib,
        isha: data.isha,
        date: now.format('DD/MM/YYYY'),
      })
      const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String()

      await ctx.deleteMessage()
      await ctx.reply(response + dailyHadith, {
        parse_mode: 'HTML',
      })

      ctx.scene.exit()
    }
  } else {
    await ctx.answerCallbackQuery(t($ => $.wrongSelection))
  }
})

export default scene
