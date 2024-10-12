import { Scene } from "grammy-scenes";
import { BotContext } from "#types/context.ts";
import HLanguage from "#helper/language.ts";
import { HReplace } from "#helper/replacer.ts";
import dayjs from "#utils/dayjs.ts";

const scene = new Scene<BotContext>("Source");

scene.step(async (ctx) => {
  let sourceReplyMessage = HLanguage("sourceMessage");
  const regionTimeLink = "https://islom.uz/vaqtlar/" + ctx.user.regionId +
    "/" + (dayjs().get("month") + 1);

  sourceReplyMessage = HReplace(
    sourceReplyMessage,
    ["$siteLink", "$sourceLink"],
    [
      regionTimeLink,
      "https://www.ziyouz.com/books/islomiy/hadis/Imom%20Navaviy.%20Riyozus%20solihiyn.pdf",
    ],
  );

  await ctx.reply("*Manbalar*:\n\n" + sourceReplyMessage, {
    parse_mode: "Markdown",
  });
  ctx.scene.exit();
});

export default scene;
