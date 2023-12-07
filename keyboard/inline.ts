import { InlineKeyboard } from 'grammy'

type InternalButton = {
  view: string
  text: string
}

export default function inlineKFunction(num: number, page: number, ...buttons: InternalButton[]) {
  let keyboard = new InlineKeyboard()

  if (buttons.length >= 15) {
    const displayButtons = buttons.splice(page * 12 - 12, 12)

    displayButtons.forEach((el, index) => {
      if (index % num == 0) {
        keyboard.row()
      }
      keyboard.text(el.view, el.text)
    })

    keyboard.row()

    keyboard.text('<', '<')
    keyboard.text(page.toString(), 'pageNumber')
    keyboard.text('>', '>')
  } else {
    buttons.forEach((el, index) => {
      if (index % num == 0) {
        keyboard.row()
      }
      keyboard.text(el.view, el.text)
    })
  }

  return keyboard
}
