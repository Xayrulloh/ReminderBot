import {InlineKeyboard} from 'grammy'

type InternalButton = {
    view: string;
    text: string
};

export default function inlineKFunction(num: number, ...buttons: InternalButton[]) {
    let keyboard = new InlineKeyboard()

    buttons.forEach((el, index) => {
        if (index % num == 0) {
            keyboard.row()
        }
        keyboard.text(el.view, el.text)
    })

    return keyboard
}
