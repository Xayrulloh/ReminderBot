import {
  Keyboard,
} from "https://deno.land/x/grammy@v1.16.0/mod.ts";

export default function customKFunction(num, ...buttons) {
  let keyboard = new Keyboard();

  buttons.forEach((el, index) => {
    if (index % num == 0) {
      keyboard.row();
    }
    keyboard.text(el);
  });

  return keyboard;
}
