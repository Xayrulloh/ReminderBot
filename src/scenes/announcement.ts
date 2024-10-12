import { Scene } from "grammy-scenes";
import Model from "#config/database.ts";
import { BotContext } from "#types/context.ts";
import { IUser } from "#types/database.ts";
import { handleSendMessageError } from "#helper/errorHandler.ts";
import { FilterQuery } from "mongoose";

const scene = new Scene<BotContext>("Announcement");

scene.step(async (ctx) => {
    if (1151533771 === ctx.from?.id) {
        await ctx.reply("To whom");
    } else {
        ctx.scene.exit();
    }
});

scene.wait("whom").on("message:text", async (ctx) => {
    ctx.session.whom = ctx.update.message?.text;

    await ctx.reply("Give me a message to send");
    ctx.scene.resume();
});

scene.wait("message").on("message:text", async (ctx) => {
    const whereQuery: FilterQuery<IUser> = {
        deletedAt: null,
        status: true,
    };

    !isNaN(+ctx.session.whom) ? (whereQuery.userId = ctx.session.whom) : false;

    const users = await Model.User.find<IUser>(whereQuery);

    for (const user of users) {
        try {
            await ctx.api.sendMessage(user.userId, ctx.message.text);
        } catch (error: any) {
            await handleSendMessageError(error, user);
        }
    }

    ctx.scene.exit();
});

export default scene;
