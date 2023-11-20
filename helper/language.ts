import fs from 'fs'
import path from 'path'
import { memoryStorage } from '#config/storage'
import process from 'node:process'

export default function HLanguage(key: any): any {
  const translate = memoryStorage.read('translate')

  if (translate && key in translate) {
    return translate[key]
  }

  let data = fs.readFileSync(path.join(process.cwd(), 'translate', 'uz.json'), {
    encoding: 'utf-8',
  })

  data = JSON.parse(data)

  memoryStorage.write('translate', data)

  return data[key]
}
