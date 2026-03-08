interface Resources {
	translation: {
		addToGroup: "Guruhga qo'shish";
		agreementFasting: ["Ha", "Yo'q"];
		announcementOptions: [
			{
				text: "1";
				view: "Individual";
			},
			{
				text: "2";
				view: "Barchaga";
			},
		];
		announcementToWhom: "Xabarni kimga jo'natish kerak";
		asrTime: "🌆 Asr vaqti bo'ldi";
		botRegistered: "Bot allaqachon ishga tushirilgan";
		breakFast: "🌉 Og'iz ochish vaqti bo'ldi\n\nاَللَّهُمَّ لَكَ صُمْتُ وَ بِكَ آمَنْتُ وَ عَلَيْكَ تَوَكَّلْتُ وَ عَلىٰ رِزْقِكَ أَفْتَرْتُ، فَغْفِرْلِى مَا قَدَّمْتُ وَ مَا أَخَّرْتُ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ\n\nАллоҳумма лака сумту ва бика ааманту ва аълайка таваккалту ва аълаа ризқика афтарту, фағфирлий ма қоддамту ва маа аххорту бироҳматика йаа арҳамар рооҳимийн";
		chooseRegion: "Mintaqani belgilang";
		closeFast: "🏙 Og'iz yopish vaqti bo'ldi\n\nنَوَيْتُ أَنْ أَصُومَ صَوْمَ شَهْرَ رَمَضَانَ مِنَ الْفَجْرِ إِلَى الْمَغْرِبِ، خَالِصًا لِلهِ تَعَالَى أَللهُ أَكْبَرُ\n\nНавайту ан асувма совма шаҳри рамазона минал фажри илал мағриби, холисан лиллаҳи таъаалаа Аллоҳу акбар";
		currentRegion: "Hozirgi mintaqa: ";
		dhuhrTime: "🏞 Peshin vaqti bo'ldi";
		donateError: "Serverda xatolik yuz berdi";
		donateMessage: "Qancha pul to'lamoqchimisiz?";
		donateThanks: "To'lovingiz uchun rahmat";
		donateUrl: "To'lov uchun havola ";
		enter: "Kirish";
		fajrTime: "🏙 Bomdod vaqti bo'ldi";
		fastingMessage: "Ro'za tutyapsizmi?";
		feedbackEndMessage: "Fikr-mulohazalaringiz uchun tashakkur. Biz buni qadrlaymiz!";
		feedbackStartMessage: "Taklif yoki shikoyatingizni yozing";
		hintMessage: "<b>Salom foydalanuvchi!</b>\nSiz inline rejimni ishga tushurdingiz.\nUshbu qulaylik yordamida siz O'zbekistondagi namoz vaqtlarini bilib olish imkoniyatiga ega bo'lasiz.\nQidirishni boshlash uchun \n <code>@namoz5vbot &lt;shahar yoki viloyat nomini&gt;</code> \n yozing";
		infoPrayTime: "Sana: {{date}}\n{{region}} shahar namoz vaqtlari\n\n🏙 Bomdod {{fajr}}\n🌅 Quyosh {{sunrise}}\n🏞 Peshin {{dhuhr}}\n🌆 Asr {{asr}}\n🌉 Shom {{maghrib}}\n🌃 Xufton {{isha}}";
		infoPrayTimeFasting: "Sana: {{date}}\n{{region}} shahar namoz vaqtlari\n\n🏙 Bomdod (saharlik) {{fajr}}\n🌅 Quyosh {{sunrise}}\n🏞 Peshin {{dhuhr}}\n🌆 Asr {{asr}}\n🌉 Shom (iftorlik) {{maghrib}}\n🌃 Xufton {{isha}}";
		ishaTime: "🌃 Xufton vaqti bo'ldi";
		locationChange: "Sizning joylashuvingiz o'zgartirildi.";
		maghribTime: "🌉 Shom vaqti bo'ldi";
		mainKeyboard: [
			"🔍 Qidirish",
			"🌍 Joylashuvni o'zgartirish",
			"🍽 Ro'za",
			"🔔 Xabarnomani o'zgartirish",
			"📊 Statistika",
			"📚 Manba",
			"📜 Hadis",
			"📖 Qur'on va Tafsiri",
			"📢 Taklif yoki Shikoyat",
		];
		nonAdminPermission: "Sozlamalarni faqat guruh adminlari o'zgartirishi mumkin.";
		notFound: "So'rov bo'yicha xech narsa topilmadi";
		notFoundContent: "<b>{{inlineQueryText}} ga oid natija mavjud emas!</b>\nIltimos, qaytadan urinib ko'ring.";
		notFoundDescription: "{{inlineQueryText}} ga oid natija topilmadi!";
		notifChange: "O'zgartirildi";
		searchPlace: "Qidirmoqchi bo'lgan shaxar yoki viloyat nomini yozing!";
		searchRegion: "Shaxarni belgilang";
		selectDay: "Kerakli kunni belgilang:";
		selectDayOptions: ["Bugun", "Boshqa kun"];
		setPrayerTimes: "Xabarnoma kelishini hohlagan vaqtlaringizni belgilang va saqlang";
		setPrayerTimesKeyboard: {
			asr: "🌆 Asr";
			dhuhr: "🏞 Peshin";
			fajr: "🏙 Bomdod";
			isha: "🌃 Xufton";
			maghrib: "🌉 Shom";
			save: "✅ Saqlash";
			sunrise: "🌅 Quyosh";
		};
		shareMessage: "Ushbu botni yaqinlaringizga ham ulashing va namoz o'z vaqtida o'qilishiga sababchi bo'ling";
		shareQuranVaTafsiri: "https://t.me/Quron_va_Tafsiri\n\nAssalomu alaykum. Ushbu kanalda siz qur'on va uning tafsirini audio tarzda eshitib o'rganishingiz mumkin. Audio format avval o'zbek tilida keyin esa arab tilida keltirilgan. O'ylaymizki bu siz uchun manfatli bo'ladi";
		source: "Manba";
		sourceMessage: "_Namoz vaqtlari:_ [islom.uz](https://islom.uz)\n_Hadislar to'plami:_ [Riyozus solihiyn]({{sourceLink}})";
		startSearch: "Qidirishni boshlang!";
		sunriseFastingTime: "🌅 Bomdod vaqti o'tib ketdi";
		sunriseTime: "🌅 Bomdod vaqti o'tib ketdi";
		tryAgain: "Qayta urinib ko'ramizmi?";
		usersCount: "Individual foydalanuvchilar soni: ";
		welcome: "Xush kelibsiz";
		wrongSelection: "Quyidagilardan birini tanlang";
	};
}

export default Resources;
