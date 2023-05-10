import {
  InlineKeyboard
} from "https://deno.land/x/grammy@v1.16.0/mod.ts";

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
