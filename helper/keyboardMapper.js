import HLanguage from '#helper/language'

export const keyboardMapper = (language, text) => {
  const keyboardText = HLanguage(language, 'mainKeyboard')

  const options = {
    [keyboardText[0]]: 'Search',
    [keyboardText[1]]: 'Language',
    [keyboardText[2]]: 'Location',
    [keyboardText[3]]: 'Fasting',
    [keyboardText[4]]: 'Notification',
    [keyboardText[5]]: 'Statistic',
    // [keyboardText[6]]: "Donate"
  }

  return options[text]
}
