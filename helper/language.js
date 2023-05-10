import { join } from 'https://deno.land/std/path/mod.ts';
import { readFileSync } from "node:fs";

export default function HLanguage(lang, key) {
  let data = readFileSync(join(Deno.cwd(), 'translate', `${lang}.json`))

  data = JSON.parse(data)

  return data[key]
}
