import { Keyboard } from "grammy";

export default function replace(...buttons) {
  let keyboard = new Keyboard();

  buttons.forEach((el, index) => {
    if (index % 3 == 0) {
      keyboard.row();
    }
    keyboard.text(el);
  });

  return keyboard;
}
