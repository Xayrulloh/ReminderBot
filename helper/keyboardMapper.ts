import { t } from '#config/i18n'

export const keyboardMapper = (text: string) => {
  const keyboardText = t($ => $.mainKeyboard, { returnObjects: true })

  const options: Record<string, string> = {
    [keyboardText[0]]: 'Search',
    [keyboardText[1]]: 'Location',
    [keyboardText[2]]: 'Fasting',
    [keyboardText[3]]: 'Notification',
    [keyboardText[4]]: 'Statistic',
    [keyboardText[5]]: 'Source',
    [keyboardText[6]]: 'Hadith',
    [keyboardText[7]]: 'Quran',
    [keyboardText[8]]: 'Feedback',
    // [keyboardText[5]]: "Donate"
  }

  return options[text]
}
