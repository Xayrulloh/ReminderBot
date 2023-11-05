import { InlineKeyboard } from 'grammy'
import Model from '#config/database'
import HLanguage from '#helper/language'
import { HReplace } from '#helper/replacer'
import { BotContext } from '#types/context'
import { InlineQueryResult, InputMessageContent } from '@grammyjs/types'
import crypto from 'crypto'
import fuzzy from 'fuzzy'
import { memoryStorage } from '#config/storage'
import { DAILY_HADITH_KEY } from '#utils/constants'
import { IPrayTime } from '#types/database'

export async function inlineQuery(ctx: BotContext) {
  const inlineQueryMessage = ctx.inlineQuery?.query
  const tryAgain: string = HLanguage('tryAgain')
  const inputMessageContent: InputMessageContent = {
    parse_mode: 'HTML',
    message_text: '',
  }
  const responseObj: InlineQueryResult = {
    type: 'article',
    id: crypto.randomUUID(),
    title: '',
    reply_markup: new InlineKeyboard().switchInlineCurrent(tryAgain, ''),
    input_message_content: inputMessageContent,
  }

  // if not inline query
  if (!inlineQueryMessage) {
    responseObj.title = HLanguage('startSearch')
    responseObj.description = HLanguage('searchPlace')
    inputMessageContent.message_text = HLanguage('hintMessage')

    return await ctx.answerInlineQuery([responseObj])
  }

  // if exist inline query
  const allRegions = HLanguage('region')
  const search = fuzzy.filter(inlineQueryMessage, Object.keys(allRegions))

  // but not result
  if (!search.length) {
    responseObj.title = HLanguage('notFound')
    let description: string = HLanguage('notFoundDescription')
    let message_text: string = HLanguage('notFoundContent')

    responseObj.description = HReplace(description, ['$inlineQueryText'], [inlineQueryMessage])
    inputMessageContent.message_text = HReplace(message_text, ['$inlineQueryText'], [inlineQueryMessage])

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
  const regionTranslations: Record<string, number> = HLanguage('region')
  const regions = await Model.PrayTime.find<IPrayTime>({ day: currentDay, regionId: regionIds })
  const message = HLanguage('infoPrayTime')
  const dailyHadith = memoryStorage.read(DAILY_HADITH_KEY) ?? String()
  const response: InlineQueryResult[] = []
  const keyboard = new InlineKeyboard()
  const enterMessage = HLanguage('enter')

  keyboard.url(enterMessage, 'https://t.me/namoz5vbot')

  for (const region of regions) {
    let regionName = ''

    for (const key in regionTranslations) {
      if (region.regionId === regionTranslations[key]) {
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
        message_text: content + '\n\n<pre>' + dailyHadith + '</pre>',
        parse_mode: 'HTML',
      },
      reply_markup: keyboard,
    })
  }

  return await ctx.answerInlineQuery(response)
}
