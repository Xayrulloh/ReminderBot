import { InlineKeyboard } from 'grammy'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import crypto from 'crypto'
import fuzzy from 'fuzzy'

export async function inlineQuery(ctx) {
  const userRequest = ctx.update.inline_query.from

  if (userRequest.is_bot) return

  const user = await Model.User.findOne({ id: userRequest.id })
  const inlineQueryMessage = ctx.inlineQuery?.query
  const tryAgain = HLanguage(user.language, 'tryAgain')
  const responseObj = {
    type: 'article',
    id: crypto.randomUUID(),
    reply_markup: new InlineKeyboard().switchInlineCurrent(tryAgain, ''),
    input_message_content: {
      parse_mode: 'HTML',
    },
  }

  // if not inline query
  if (!inlineQueryMessage) {
    responseObj.title = HLanguage(user.language, 'startSearch')
    responseObj.description = HLanguage(user.language, 'searchPlace')
    responseObj.input_message_content.message_text = HLanguage(user.language, 'hintMessage')

    return await ctx.answerInlineQuery([responseObj])
  }

  // if exist inline query
  const allRegions = { ...HLanguage('ru', 'region'), ...HLanguage('uz', 'region'), ...HLanguage('en', 'region') }
  const search = fuzzy.filter(inlineQueryMessage, Object.keys(allRegions))

  // but not result
  if (!search.length) {
    responseObj.title = HLanguage(user.language, 'notFound')
    let description = HLanguage(user.language, 'notFoundDescription')
    let message_text = HLanguage(user.language, 'notFoundContent')

    responseObj.description = HReplace(description, ['$inlineQueryText'], [inlineQueryMessage])
    responseObj.input_message_content.message_text = HReplace(message_text, ['$inlineQueryText'], [inlineQueryMessage])

    return await ctx.answerInlineQuery([responseObj])
  }

  // if result is exist
  let regionIds = []

  for (const result of search) {
    for (const key in allRegions) {
      if (key == result.string) regionIds.push(allRegions[key])
    }
  }

  regionIds = [...new Set(regionIds)].slice(0, 3)

  const now = new Date()
  const currentDay = now.getDate()
  const regionTranslations = HLanguage(user.language, 'region')
  const regions = await Model.PrayTime.find({ day: currentDay, regionId: regionIds })
  const message = HLanguage(user.language, 'infoPrayTime')
  const response = []

  for (const region of regions) {
    let regionName

    for (const key in regionTranslations) {
      if (region.regionId == regionTranslations[key]) {
        regionName = key
      }
    }

    const content = HReplace(
      message,
      ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
      [regionName, region.fajr, region.sunrise, region.dhuhr, region.asr, region.maghrib, region.isha],
    )

    response.push({
      type: 'article',
      id: crypto.randomUUID(),
      title: regionName,
      description: content,
      input_message_content: {
        message_text: content,
        parse_mode: 'HTML',
      },
    })
  }

  return await ctx.answerInlineQuery(response)
}
