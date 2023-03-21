import axios from 'axios'
import pdfParser from 'pdf-parse'
import Model from '#config/database'
import HLanguage from '#helper/language'

export async function monthlyScrap() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const keyboardMessage = HLanguage('uz', 'region')
  const regions = Object.keys(keyboardMessage)
  const regionIds = Object.values(keyboardMessage)
  const daysOfWeek = ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба']

  await Model.PrayTime.deleteMany()

  for (let i = 0; i < regions.length; i++) {
    const pdf = await axios.get(process.env.TIME_API + regionIds[i] + '/' + currentMonth, {
      responseType: 'arraybuffer',
    })
    const pdfData = await pdfParser(pdf.data, { normalizeWhitespace: true })
    const data = pdfData.text.split('\n')

    for (let el of data) {
      if (el.length > 20 && el.split(' ').length == 1) {
        for (let day of daysOfWeek) {
          if (el.includes(day)) {
            let dayNumber = el.split(day)[0]
            let times = el.split(day)[1].match(/.{1,5}/g)

            await Model.PrayTime.create({
              region: regions[i],
              regionId: regionIds[i],
              day: dayNumber,
              fajr: times[0],
              sunrise: times[1],
              dhuhr: times[2],
              asr: times[3],
              maghrib: times[4],
              isha: times[5],
            })
          }
        }
      }
    }
  }
}

monthlyScrap(27, 'Tashkent')
