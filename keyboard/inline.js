import { InlineKeyboard } from "grammy";

export default function inlineKFunction(num, ...buttons) {
  let keyboard = new InlineKeyboard();

  buttons.forEach((el, index) => {
    if (index % num == 0) {
      keyboard.row();
    }
    keyboard.text(el.view, el.text);
  });

  return keyboard;
}
