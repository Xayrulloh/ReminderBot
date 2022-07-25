import axios from "axios";

let regions = ["Andijon", "Buxoro", "Jizzax", "Qashqadaryo", "Navoiy", "Namangan", "Samarqand", "Sirdaryo", "Surxondaryo", "Toshkent", "Farg'ona", "Xorazm"];
let badRegions = [ "andizhan", "buhara", "dzhizak", "kashkadarya", "navoi", "namangan", "samarkand", "gulistan", "termez", "tashkent", "fergana", "urgench"];
const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

export default async function (region) {
  let [month, date, year] = new Date().toLocaleDateString("en-UZ").split("/");
  let hijriy = new Intl.DateTimeFormat('uz-FR-u-ca-islamic', {day: 'numeric', month: 'long',weekday: 'long',year : 'numeric'}).format(Date.now());
  let day = new Date(), response;
  let data = await axios.get(`http://18.212.226.226:8000/chirchik`)
  if (day.getDay() == 5) {
    response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${region} shahar namoz vaqtlari\n\n🏙 Bomdod ${data.data.data[0]}\n🌅 Quyosh ${data.data.data[1]}\n🏞 Juma 13:00\n🌆 Asr ${data.data.data[3]}\n🌉 Shom ${data.data.data[4]}\n🌃 Xufton ${data.data.data[5]}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir.\nNiso surasi 103-oyat`
  } else {
    response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${region} shahar namoz vaqtlari\n\n🏙 Bomdod ${data.data.data[0]}\n🌅 Quyosh ${data.data.data[1]}\n🏞 Peshin ${data.data.data[2]}\n🌆 Asr ${data.data.data[3]}\n🌉 Shom ${data.data.data[4]}\n🌃 Xufton ${data.data.data[5]}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir.\nNiso surasi 103-oyat`}
  return [response, data.data.data];
}