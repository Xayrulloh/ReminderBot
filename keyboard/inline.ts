import { PER_PAGE } from '#utils/constants'
import { InlineKeyboard } from 'grammy'

type InternalButton = {
  view: string
  text: string
}

export default function inlineKFunction(num: number, buttons: InternalButton[], page = 1) {
  let keyboard = new InlineKeyboard()

  if (buttons.length >= 15) {
    const displayButtons = buttons.slice((page - 1) * PER_PAGE, PER_PAGE * page)

    displayButtons.forEach((el, index) => {
      if (index % num == 0) {
        keyboard.row()
      }
      keyboard.text(el.view, el.text)
    })

    keyboard.row()

    keyboard.text('<', '<')
    keyboard.text(`${page.toString()}/${Math.ceil(buttons.length / PER_PAGE)}`, 'pageNumber')
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
