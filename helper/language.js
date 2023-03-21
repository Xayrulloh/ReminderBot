import fs from 'fs'
import path from 'path'

export default function HLanguage(lang, key) {
  let data = fs.readFileSync(path.join(process.cwd(), 'translate', `${lang}.json`))

  data = JSON.parse(data)

  return data[key]
}
