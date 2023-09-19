import fs from 'fs'
import path from 'path'

export default function HLanguage(lang: string, key: any): any {
  let data = fs.readFileSync(path.join(process.cwd(), 'translate', `${lang}.json`), {
    encoding: 'utf-8',
  })

  data = JSON.parse(data)

  return data[key]
}
