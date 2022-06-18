import axios from 'axios'

let regions = ['Andijan', 'Buxoro', 'Jizzax', 'Qashqadaryo', 'Navoi', 'Namangan', 'Samarqand', 'Sirdaryo', 'Surxandaryo', 'Toshkent', "Farg'ona", 'Xorazm']
let badRegions = ['andizhan', 'buhara', 'dzhizak', 'kashkadarya', 'navoi', 'namangan', 'samarkand', 'gulistan', 'termez', 'tashkent', 'fergana', 'urgench']

export default async function(region) {
    let data = await axios.get(`https://m69638.dcserver-1.ru/namoz/api/index.php?text=${badRegions[regions.findIndex(el => el === region)]}`)
    let time = data.data.split('\n')
    let response = `🕌 ${region} shahar \n namoz vaqtlari\n👳🏻‍♂️|🧕🏼 Bomdod ${time[2].slice(-5)}\n👳🏻‍♂️|🧕🏼 Quyosh ${time[3].slice(-5)}\n👳🏻‍♂️|🧕🏼 Peshin ${time[4].slice(-5)}\n👳🏻‍♂️|🧕🏼 Asr ${time[5].slice(-5)}\n👳🏻‍♂️|🧕🏼 Shom ${time[6].slice(-5)}\n👳🏻‍♂️|🧕🏼 Xufton ${time[7].slice(-5)}`
    
    return [response, [time[2].slice(-5), time[3].slice(-5), time[4].slice(-5), time[5].slice(-5), time[6].slice(-5), time[7].slice(-5)]]
}