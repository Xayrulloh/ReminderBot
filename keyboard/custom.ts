import { Keyboard } from 'grammy'

export default function customKFunction(num: number, ...buttons: string[]) {
  let keyboard = new Keyboard()

  buttons.forEach((el, index) => {
    if (index % num == 0) {
      keyboard.row()
    }
    keyboard.text(el)
  })

  return keyboard
}
