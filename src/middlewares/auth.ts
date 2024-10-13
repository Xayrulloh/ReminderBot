import Model from "#config/database.ts";
import { inlineQuery } from "#query/inline.ts";
import { BotContext } from "#types/context.ts";
import { NextFunction } from "grammy";
import { memoryStorage } from "#config/storage.ts";
import { IUser } from "#types/database.ts";

export async function authMiddleware(ctx: BotContext, next: NextFunction) {
  if (ctx.from?.is_bot) return;

  // if inline query
  if (ctx.update?.inline_query?.id) {
    return inlineQuery(ctx);
  }

  // Caching to memory
  const key = String(ctx.from?.id);
  let user = memoryStorage.read(key);
  if (user) {
    ctx.user = user;

    return next();
  }

  // finding user from db
  const userId = ctx.from?.id;
  user = await Model.User.findOne<IUser>({ userId });

  if (!user) {
    const isStartSceneActive = ctx.session.scenes?.stack?.some((stack) =>
      stack.scene === "Start"
    );

    if (isStartSceneActive) {
      return next();
    } else {
      return ctx.scenes.enter("Start");
    }
  }

  memoryStorage.write(key, user);
  ctx.user = user;

  return next();
}
