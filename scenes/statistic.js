import { Scene } from "grammy-scenes";
import Data from "#database";

let newScene = new Scene("Statistic");

newScene.do(async (ctx) => {
  if ([1151533771, 962526857, 900604435, 722785022].includes(ctx.message.from.id)) {
    let users = await Data.find(), notificationAllowed = await Data.find({ notificationAllowed: true }), humansInRegions = await Data.aggregate([{$group: { _id: "$location", locationCount: { $sum: 1 }}}])
    let message = `All users are ${users.length}\nNotification allowed users are ${notificationAllowed.length}\nNotification not allowed users are ${users.length - notificationAllowed.length}\n`
    humansInRegions.map(el => {message += `${el._id} has ${el.locationCount} person\n`})
    ctx.reply(message)
    ctx.scene.exit()
  } else {
    ctx.reply('Siz admin emas siz!')
    ctx.scene.exit()
  }
});

export default newScene;