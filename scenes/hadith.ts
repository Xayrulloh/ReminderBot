import {Scene} from 'grammy-scenes'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import {BotContext} from "#types/context";
import {InlineKeyboard} from "grammy";

const scene = new Scene<BotContext>('Hadith')

scene.do(async (ctx) => {
    if (1151533771 == ctx.from?.id) {
        ctx.reply('Give me the hadith')
    } else {
        ctx.scene.exit()
    }
})

scene.wait().on('message:text', async (ctx) => {
    ctx.session.hadith = ctx.message.text

    const categories = await Model.Hadith.distinct('category')

    let buttons: InlineKeyboard | undefined;
    if (categories.length) {
        buttons = inlineKFunction(
            5,
            ...categories.map((c) => {
                return {view: c, text: c}
            }),
        )
    }

    ctx.reply('Give the category of hadith', {reply_markup: buttons})

    ctx.scene.resume()
})

scene.wait().on(['message:text', 'callback_query:data'], async (ctx) => {
    const category =
        ctx?.message?.text == 'not' ? undefined : ctx?.message?.text ? ctx.message.text : ctx.callbackQuery?.data

    await Model.Hadith.create({
        content: ctx.session.hadith,
        category,
    })

    ctx.reply('Hadith wrote thank you. You are doing your best')

    ctx.scene.exit()
})

export default scene
