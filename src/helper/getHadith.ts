import Model from "#config/database.ts";
import { memoryStorage } from "#config/storage.ts";
import { IHadith } from "#types/database.ts";
import { DAILY_HADITH_KEY } from "#utils/constants.ts";
import dayjs from "#utils/dayjs.ts";

export async function getHadith(): Promise<string> {
    // taking hadith
    const now = dayjs();
    const weekDay = now.get("day");
    let hadith: IHadith[] | string;

    if (weekDay == 5) {
        hadith = await Model.Hadith.aggregate<IHadith>([{
            $match: { category: "juma" },
        }, { $sample: { size: 1 } }]);
    } else {
        hadith = await Model.Hadith.aggregate<IHadith>([
            { $match: { category: { $ne: "juma" } } },
            { $sample: { size: 1 } },
        ]);
    }

    hadith = "\n\n<pre>" + hadith[0]?.content + "</pre>";

    // Set daily hadith to storage
    memoryStorage.write(DAILY_HADITH_KEY, hadith);

    return hadith;
}
