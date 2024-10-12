import { Scene } from "grammy-scenes";
import HLanguage from "#helper/language.ts";
import axios from "axios";
import { BotContext } from "#types/context.ts";
import { env } from "#utils/env.ts";

const scene = new Scene<BotContext>("Donate");

scene.step(async (ctx) => {
    const message = HLanguage("donateMessage");

    ctx.session.message = message;

    await ctx.reply(message);
});

scene.wait("amount").on("message:text", async (ctx) => {
    const amount = +ctx.update.message.text;

    if (!isNaN(amount) && amount <= 10_000_000 && amount >= 1_000) {
        try {
            const [response] = await Promise.all([
                axios.post(env.PAYME_URL + "p2p/create", {
                    number: env.CARD,
                    amount,
                }),
            ]);

            if (!response.data?.success) {
                const message = HLanguage("donateError");
                await ctx.reply(message);
                ctx.scene.exit();
                return;
            }

            const endpoint = env.PAYME_ENDPOINT +
                response.data?.result?.chequeid;
            const message = HLanguage("donateUrl");
            const messageThanks = HLanguage("donateThanks");

            ctx.user.donate += amount;
            ctx.user.save();

            await ctx.reply(message + endpoint + "\n\n" + messageThanks);
        } catch (_) {
            const message = HLanguage("donateError");
            await ctx.reply(message);
        }

        ctx.scene.exit();
    } else {
        await ctx.reply(ctx.session.message);
    }
});

export default scene;
