import axios from "axios";
import fs from 'fs'
import path from 'path'
import Redis from 'redis'

let districts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'places', 'districts.json'))), redisClient = Redis.createClient()
const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

await redisClient.connect()
redisClient.on('error', (err) => console.log('Redis Client Error', err));

export default async function (region, newDay) {
  if (newDay) redisClient.flushAll()

  let [month, date, year] = new Date().toLocaleDateString("en-UZ").split("/");
  let hijriy = new Intl.DateTimeFormat('uz-SA-u-ca-islamic-umalqura', {day: 'numeric', month: 'long',weekday: 'long',year : 'numeric'}).format(Date.now());
  let response, redisData = JSON.parse(await redisClient.get(region))

  if (redisData) {
    if (new Date().getDay() == 5) {
      response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${districts[region]} shahar namoz vaqtlari\n\n🏙 Bomdod ${redisData[0]}\n🌅 Quyosh ${redisData[1]}\n🏞 Juma 13:00\n🌆 Asr ${redisData[3]}\n🌉 Shom ${redisData[4]}\n🌃 Xufton ${redisData[5]}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir.\nNiso surasi 103-oyat`
      redisData[2] = '13:00'
    } else {
      response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${districts[region]} shahar namoz vaqtlari\n\n🏙 Bomdod ${redisData[0]}\n🌅 Quyosh ${redisData[1]}\n🏞 Peshin ${redisData[2]}\n🌆 Asr ${redisData[3]}\n🌉 Shom ${redisData[4]}\n🌃 Xufton ${redisData[5]}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir.\nNiso surasi 103-oyat`
    }
    return [response, redisData]
  }
  
  let data = await axios.get(`http://18.212.226.226:8000/${region}`)
  if (new Date().getDay() == 5) {
    response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${districts[region]} shahar namoz vaqtlari\n\n🏙 Bomdod ${data.data.data[0]}\n🌅 Quyosh ${data.data.data[1]}\n🏞 Juma 13:00\n🌆 Asr ${data.data.data[3]}\n🌉 Shom ${data.data.data[4]}\n🌃 Xufton ${data.data.data[5]}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir.\nNiso surasi 103-oyat`
    data.data.data[2] = '13:00'
  } else {
    response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${districts[region]} shahar namoz vaqtlari\n\n🏙 Bomdod ${data.data.data[0]}\n🌅 Quyosh ${data.data.data[1]}\n🏞 Peshin ${data.data.data[2]}\n🌆 Asr ${data.data.data[3]}\n🌉 Shom ${data.data.data[4]}\n🌃 Xufton ${data.data.data[5]}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir.\nNiso surasi 103-oyat`
  }

  redisClient.setEx(region, 86400000, JSON.stringify(data.data.data))
  
  return [response, data.data.data];
}
