import * as path from "@std/path";
import { memoryStorage } from "#config/storage.ts";

export default function HLanguage(key: any): any {
  const translate = memoryStorage.read("translate");

  if (translate && key in translate) {
    return translate[key];
  }

  const decoder = new TextDecoder("utf-8");
  let data = Deno.readFileSync(
    path.join(Deno.cwd(), "translate", "uz.json"),
  );

  data = JSON.parse(decoder.decode(data));

  memoryStorage.write("translate", data);

  return data[key];
}
