import axios from "axios";

let regions = [ "Andijan", "Buxoro", "Jizzax", "Qashqadaryo", "Navoi", "Namangan", "Samarqand", "Sirdaryo", "Surxandaryo", "Toshkent", "Farg'ona", "Xorazm"];
let badRegions = [ "andizhan", "buhara", "dzhizak", "kashkadarya", "navoi", "namangan", "samarkand", "gulistan", "termez", "tashkent", "fergana", "urgench"];

export default async function (region) {
  let data = await axios.get(`https://m69638.dcserver-1.ru/namoz/api/index.php?text=${badRegions[regions.findIndex((el) => el === region)]}`);
  let time = data.data.split("\n"), day = new Date(), response;

  if (day.getDay() == 5) {
    response = `🕌 ${region} shahar namoz vaqtlari\n\n🏙 Bomdod ${time[2].slice(-5)}\n\n🌅 Quyosh ${time[3].slice(-5)}\n\n🏞 Juma 13:00\n\n🌇 Asr ${time[5].slice(-5)}\n\n🌆 Shom ${time[6].slice(-5)}\n\n🌃 Xufton ${time[7].slice(-5)}\n\n                        إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا\n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir\n\nNiso surasi 103-oyat`
  } else {
    response = `🕌 ${region} shahar namoz vaqtlari\n\n🏙 Bomdod ${time[2].slice(-5)}\n\n🌅 Quyosh ${time[3].slice(-5)}\n\n🏞 Peshin ${time[4].slice(-5)}\n\n🌇 Asr ${time[5].slice(-5)}\n\n🌆 Shom ${time[6].slice(-5)}\n\n🌃 Xufton ${time[7].slice(-5)}\n\n إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا                     \n\nAlbatta, namoz mo'minlarga vaqtida farz qilingandir\n\nNiso surasi 103-oyat`}
  return [response, [time[2].slice(-5),time[3].slice(-5),time[4].slice(-5),time[5].slice(-5),time[6].slice(-5),time[7].slice(-5)]];
}