import { InlineKeyboard } from "grammy";
import fs from "fs";
import path from "path";
import regionsFunction from "#region";
import crypto from "crypto";
import fuzzy from "fuzzy";

const data = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "places", "cites.json"))
);
const city = Object.keys(data);

export default async function (ctx) {
  if (ctx.inlineQuery?.query) {
    const request = await search(ctx.inlineQuery?.query);
    if (request.length === 0) {
      return await ctx.answerInlineQuery([
        {
          type: "article",
          id: "404",
          title: "Xatolik yuz berdi!",
          description: `${ctx.inlineQuery?.query} ga oid natija topilmadi!`,
          reply_markup: new InlineKeyboard().switchInlineCurrent(
            "Qayta urinib ko'ramizmi?",
            ""
          ),
          input_message_content: {
            message_text:
              `<b>"${ctx.inlineQuery?.query}" ga oid natija mavjud emas!</b>` +
              `\n` +
              `Iltimos, qaytadan urinib ko'ring.`,
            parse_mode: "HTML",
          },
        },
      ]);
    }

    return await ctx.answerInlineQuery(
      Object.keys(request).map((key) => ({
        type: "article",
        id: crypto.randomUUID(),
        title: key,
        description:
          "Bugungi namoz vaqtlar\n" + request[key].array.join(", ") + "",
        input_message_content: {
          message_text: request[key].string,
          parse_mode: "HTML",
        },
      }))
    );
  }

  if (!ctx.inlineQuery?.query) {
    return await ctx.answerInlineQuery([
      {
        type: "article",
        id: "101",
        title: "Qidirishni boshlang!",
        description: "Qidirmoqchi bo'lgan shaxaringiz nomini yozing!",
        reply_markup: new InlineKeyboard().switchInlineCurrent(
          "Qayta urinib ko'ramizmi?",
          ""
        ),
        input_message_content: {
          message_text:
            `<b>Salom foydalanuvchi!</b>` +
            `\n` +
            `Siz inline rejim ishga tushurdingiz. Ushbu qulaylik yordamida siz O'zbekistondagi" ` +
            `namoz vaqtlarini bilib olish imkoniyatiga ega bo'lasiz.` +
            ` Qidirishni boshlash uchun ` +
            `\n` +
            `<code>@namoz5vbot &lt;shahar nomi&gt;</code>` +
            `\n` +
            `yozasiz`,
          parse_mode: "HTML",
        },
      },
    ]);
  }
}

async function search(str) {
  let search = fuzzy.filter(str, city);
  search = search.map((el) => el.string);
  if (!search.length) {
    return search;
  }
  let result = {};
  for (let i of search) {
    let info = await regionsFunction(data[i]);
    result[i] = { string: info[0], array: info[1] };
  }

  return result;
}
