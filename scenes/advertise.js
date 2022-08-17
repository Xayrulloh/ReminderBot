import { Scene } from "grammy-scenes";
import Data from "#database";

let newScene = new Scene("Advertise");

newScene.do(async (ctx) => {
  if (1151533771 == ctx.message.from.id) {
    ctx.reply('Reklamani kiriting!')
  } else {
    ctx.reply('Siz admin emas siz!')
    ctx.scene.exit()
  }
});

newScene.wait().on("message:text", async (ctx) => {
  let users = await Data.find();
  users.forEach(async (user) => {
    ctx.api.sendMessage(user.userId, ctx.message.text)
  });
  ctx.scene.exit()
});

export default newScene;