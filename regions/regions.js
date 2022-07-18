import axios from "axios";

let regions = [ "Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm"];
let badRegions = [ "andizhan", "buhara", "dzhizak", "kashkadarya", "navoi", "namangan", "samarkand", "gulistan", "termez", "tashkent", "fergana", "urgench"];
const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
let [month, date, year] = new Date().toLocaleDateString("en-US").split("/");
let hijriy = new Intl.DateTimeFormat('uz-FR-u-ca-islamic', {day: 'numeric', month: 'long',weekday: 'long',year : 'numeric'}).format(Date.now());

export default async function (region) {
  let data = await axios.get(`https://m69638.dcserver-1.ru/namoz/api/index.php?text=${badRegions[regions.findIndex((el) => el === region)]}`);
  let time = data.data.split("\n"), day = new Date(), response;

  if (day.getDay() == 5) {
    response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${region} shahar namoz vaqtlari\n\n🏙 Bomdod ${time[2].slice(-5)}\n🌅 Quyosh ${time[3].slice(-5)}\n🏞 Juma 13:00\n🌉 Asr ${time[5].slice(-5)}\n🌆 Shom ${time[6].slice(-5)}\n🌃 Xufton ${time[7].slice(-5)}\n\n                        إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا\n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir\nNiso surasi 103-oyat`
  } else {
    response = `🗓 ${date} - ${monthNames[month - 1]} milodiy ${year} - yil\n🗓 ${hijriy.split(',')[1].split('-')[0]} - ${hijriy.split(',')[1].slice(hijriy.split(',')[1].indexOf('-') + 1)} hijriy ${hijriy.split(',')[2].slice(0, 5)} - yil\n\n🕌 ${region} shahar namoz vaqtlari\n\n🏙 Bomdod ${time[2].slice(-5)}\n🌅 Quyosh ${time[3].slice(-5)}\n🏞 Peshin ${time[4].slice(-5)}\n🌉 Asr ${time[5].slice(-5)}\n🌆 Shom ${time[6].slice(-5)}\n🌃 Xufton ${time[7].slice(-5)}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir\nNiso surasi 103-oyat`}
  return [response, [time[2].slice(-5),time[3].slice(-5),time[4].slice(-5),time[5].slice(-5),time[6].slice(-5),time[7].slice(-5)]];
}