/**
 * Genuine Quran text and audio for the demo subset.
 * Generated from the Al Quran Cloud API (Uthmani + simple-clean editions, Sahih International translation).
 * Audio: per-ayah recitation by Shaykh Mahmoud Khalil Al-Husary via cdn.islamic.network.
 * Production uses the Quran Foundation Content API v4 (see general-spec/06-hifz-engine.md).
 * Do not edit by hand; regenerate with scripts/fetch-quran.mjs.
 */
import type { Ayah, Surah } from "@/lib/domain/types";

export const SURAHS: Surah[] = [
  {
    "number": 1,
    "nameArabic": "سُورَةُ ٱلْفَاتِحَةِ",
    "nameEnglish": "The Opening",
    "nameTransliterated": "Al-Faatiha",
    "ayahCount": 7,
    "juz": 1
  },
  {
    "number": 67,
    "nameArabic": "سُورَةُ المُلۡكِ",
    "nameEnglish": "The Sovereignty",
    "nameTransliterated": "Al-Mulk",
    "ayahCount": 30,
    "juz": 29
  },
  {
    "number": 105,
    "nameArabic": "سُورَةُ الفِيلِ",
    "nameEnglish": "The Elephant",
    "nameTransliterated": "Al-Fil",
    "ayahCount": 5,
    "juz": 30
  },
  {
    "number": 106,
    "nameArabic": "سُورَةُ قُرَيۡشٍ",
    "nameEnglish": "Quraysh",
    "nameTransliterated": "Quraish",
    "ayahCount": 4,
    "juz": 30
  },
  {
    "number": 107,
    "nameArabic": "سُورَةُ المَاعُونِ",
    "nameEnglish": "Almsgiving",
    "nameTransliterated": "Al-Maa'un",
    "ayahCount": 7,
    "juz": 30
  },
  {
    "number": 108,
    "nameArabic": "سُورَةُ الكَوۡثَرِ",
    "nameEnglish": "Abundance",
    "nameTransliterated": "Al-Kawthar",
    "ayahCount": 3,
    "juz": 30
  },
  {
    "number": 109,
    "nameArabic": "سُورَةُ الكَافِرُونَ",
    "nameEnglish": "The Disbelievers",
    "nameTransliterated": "Al-Kaafiroon",
    "ayahCount": 6,
    "juz": 30
  },
  {
    "number": 110,
    "nameArabic": "سُورَةُ النَّصۡرِ",
    "nameEnglish": "Divine Support",
    "nameTransliterated": "An-Nasr",
    "ayahCount": 3,
    "juz": 30
  },
  {
    "number": 111,
    "nameArabic": "سُورَةُ المَسَدِ",
    "nameEnglish": "The Palm Fibre",
    "nameTransliterated": "Al-Masad",
    "ayahCount": 5,
    "juz": 30
  },
  {
    "number": 112,
    "nameArabic": "سُورَةُ الإِخۡلَاصِ",
    "nameEnglish": "Sincerity",
    "nameTransliterated": "Al-Ikhlaas",
    "ayahCount": 4,
    "juz": 30
  },
  {
    "number": 113,
    "nameArabic": "سُورَةُ الفَلَقِ",
    "nameEnglish": "The Dawn",
    "nameTransliterated": "Al-Falaq",
    "ayahCount": 5,
    "juz": 30
  },
  {
    "number": 114,
    "nameArabic": "سُورَةُ النَّاسِ",
    "nameEnglish": "Mankind",
    "nameTransliterated": "An-Naas",
    "ayahCount": 6,
    "juz": 30
  }
];

export const VERSES: Ayah[] = [
  {
    "surah": 1,
    "ayah": 1,
    "textUthmani": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "textSimple": "بسم الله الرحمن الرحيم",
    "translationEn": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/1.mp3"
  },
  {
    "surah": 1,
    "ayah": 2,
    "textUthmani": "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
    "textSimple": "الحمد لله رب العالمين",
    "translationEn": "[All] praise is [due] to Allah, Lord of the worlds -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/2.mp3"
  },
  {
    "surah": 1,
    "ayah": 3,
    "textUthmani": "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "textSimple": "الرحمن الرحيم",
    "translationEn": "The Entirely Merciful, the Especially Merciful,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/3.mp3"
  },
  {
    "surah": 1,
    "ayah": 4,
    "textUthmani": "مَٰلِكِ يَوْمِ ٱلدِّينِ",
    "textSimple": "مالك يوم الدين",
    "translationEn": "Sovereign of the Day of Recompense.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/4.mp3"
  },
  {
    "surah": 1,
    "ayah": 5,
    "textUthmani": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "textSimple": "إياك نعبد وإياك نستعين",
    "translationEn": "It is You we worship and You we ask for help.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5.mp3"
  },
  {
    "surah": 1,
    "ayah": 6,
    "textUthmani": "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    "textSimple": "اهدنا الصراط المستقيم",
    "translationEn": "Guide us to the straight path -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6.mp3"
  },
  {
    "surah": 1,
    "ayah": 7,
    "textUthmani": "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
    "textSimple": "صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين",
    "translationEn": "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/7.mp3"
  },
  {
    "surah": 67,
    "ayah": 1,
    "textUthmani": "تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌ",
    "textSimple": "تبارك الذي بيده الملك وهو على كل شيء قدير",
    "translationEn": "Blessed is He in whose hand is dominion, and He is over all things competent -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5242.mp3"
  },
  {
    "surah": 67,
    "ayah": 2,
    "textUthmani": "ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًۭا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ",
    "textSimple": "الذي خلق الموت والحياة ليبلوكم أيكم أحسن عملا ۚ وهو العزيز الغفور",
    "translationEn": "[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5243.mp3"
  },
  {
    "surah": 67,
    "ayah": 3,
    "textUthmani": "ٱلَّذِى خَلَقَ سَبْعَ سَمَٰوَٰتٍۢ طِبَاقًۭا ۖ مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ مِن تَفَٰوُتٍۢ ۖ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍۢ",
    "textSimple": "الذي خلق سبع سماوات طباقا ۖ ما ترى في خلق الرحمن من تفاوت ۖ فارجع البصر هل ترى من فطور",
    "translationEn": "[And] who created seven heavens in layers. You do not see in the creation of the Most Merciful any inconsistency. So return [your] vision [to the sky]; do you see any breaks?",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5244.mp3"
  },
  {
    "surah": 67,
    "ayah": 4,
    "textUthmani": "ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًۭا وَهُوَ حَسِيرٌۭ",
    "textSimple": "ثم ارجع البصر كرتين ينقلب إليك البصر خاسئا وهو حسير",
    "translationEn": "Then return [your] vision twice again. [Your] vision will return to you humbled while it is fatigued.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5245.mp3"
  },
  {
    "surah": 67,
    "ayah": 5,
    "textUthmani": "وَلَقَدْ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا بِمَصَٰبِيحَ وَجَعَلْنَٰهَا رُجُومًۭا لِّلشَّيَٰطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ ٱلسَّعِيرِ",
    "textSimple": "ولقد زينا السماء الدنيا بمصابيح وجعلناها رجوما للشياطين ۖ وأعتدنا لهم عذاب السعير",
    "translationEn": "And We have certainly beautified the nearest heaven with stars and have made [from] them what is thrown at the devils and have prepared for them the punishment of the Blaze.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5246.mp3"
  },
  {
    "surah": 67,
    "ayah": 6,
    "textUthmani": "وَلِلَّذِينَ كَفَرُوا۟ بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ ٱلْمَصِيرُ",
    "textSimple": "وللذين كفروا بربهم عذاب جهنم ۖ وبئس المصير",
    "translationEn": "And for those who disbelieved in their Lord is the punishment of Hell, and wretched is the destination.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5247.mp3"
  },
  {
    "surah": 67,
    "ayah": 7,
    "textUthmani": "إِذَآ أُلْقُوا۟ فِيهَا سَمِعُوا۟ لَهَا شَهِيقًۭا وَهِىَ تَفُورُ",
    "textSimple": "إذا ألقوا فيها سمعوا لها شهيقا وهي تفور",
    "translationEn": "When they are thrown into it, they hear from it a [dreadful] inhaling while it boils up.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5248.mp3"
  },
  {
    "surah": 67,
    "ayah": 8,
    "textUthmani": "تَكَادُ تَمَيَّزُ مِنَ ٱلْغَيْظِ ۖ كُلَّمَآ أُلْقِىَ فِيهَا فَوْجٌۭ سَأَلَهُمْ خَزَنَتُهَآ أَلَمْ يَأْتِكُمْ نَذِيرٌۭ",
    "textSimple": "تكاد تميز من الغيظ ۖ كلما ألقي فيها فوج سألهم خزنتها ألم يأتكم نذير",
    "translationEn": "It almost bursts with rage. Every time a company is thrown into it, its keepers ask them, \"Did there not come to you a warner?\"",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5249.mp3"
  },
  {
    "surah": 67,
    "ayah": 9,
    "textUthmani": "قَالُوا۟ بَلَىٰ قَدْ جَآءَنَا نَذِيرٌۭ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ ٱللَّهُ مِن شَىْءٍ إِنْ أَنتُمْ إِلَّا فِى ضَلَٰلٍۢ كَبِيرٍۢ",
    "textSimple": "قالوا بلى قد جاءنا نذير فكذبنا وقلنا ما نزل الله من شيء إن أنتم إلا في ضلال كبير",
    "translationEn": "They will say,\" Yes, a warner had come to us, but we denied and said, 'Allah has not sent down anything. You are not but in great error.'\"",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5250.mp3"
  },
  {
    "surah": 67,
    "ayah": 10,
    "textUthmani": "وَقَالُوا۟ لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِىٓ أَصْحَٰبِ ٱلسَّعِيرِ",
    "textSimple": "وقالوا لو كنا نسمع أو نعقل ما كنا في أصحاب السعير",
    "translationEn": "And they will say, \"If only we had been listening or reasoning, we would not be among the companions of the Blaze.\"",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5251.mp3"
  },
  {
    "surah": 67,
    "ayah": 11,
    "textUthmani": "فَٱعْتَرَفُوا۟ بِذَنۢبِهِمْ فَسُحْقًۭا لِّأَصْحَٰبِ ٱلسَّعِيرِ",
    "textSimple": "فاعترفوا بذنبهم فسحقا لأصحاب السعير",
    "translationEn": "And they will admit their sin, so [it is] alienation for the companions of the Blaze.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5252.mp3"
  },
  {
    "surah": 67,
    "ayah": 12,
    "textUthmani": "إِنَّ ٱلَّذِينَ يَخْشَوْنَ رَبَّهُم بِٱلْغَيْبِ لَهُم مَّغْفِرَةٌۭ وَأَجْرٌۭ كَبِيرٌۭ",
    "textSimple": "إن الذين يخشون ربهم بالغيب لهم مغفرة وأجر كبير",
    "translationEn": "Indeed, those who fear their Lord unseen will have forgiveness and great reward.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5253.mp3"
  },
  {
    "surah": 67,
    "ayah": 13,
    "textUthmani": "وَأَسِرُّوا۟ قَوْلَكُمْ أَوِ ٱجْهَرُوا۟ بِهِۦٓ ۖ إِنَّهُۥ عَلِيمٌۢ بِذَاتِ ٱلصُّدُورِ",
    "textSimple": "وأسروا قولكم أو اجهروا به ۖ إنه عليم بذات الصدور",
    "translationEn": "And conceal your speech or publicize it; indeed, He is Knowing of that within the breasts.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5254.mp3"
  },
  {
    "surah": 67,
    "ayah": 14,
    "textUthmani": "أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ ٱللَّطِيفُ ٱلْخَبِيرُ",
    "textSimple": "ألا يعلم من خلق وهو اللطيف الخبير",
    "translationEn": "Does He who created not know, while He is the Subtle, the Acquainted?",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5255.mp3"
  },
  {
    "surah": 67,
    "ayah": 15,
    "textUthmani": "هُوَ ٱلَّذِى جَعَلَ لَكُمُ ٱلْأَرْضَ ذَلُولًۭا فَٱمْشُوا۟ فِى مَنَاكِبِهَا وَكُلُوا۟ مِن رِّزْقِهِۦ ۖ وَإِلَيْهِ ٱلنُّشُورُ",
    "textSimple": "هو الذي جعل لكم الأرض ذلولا فامشوا في مناكبها وكلوا من رزقه ۖ وإليه النشور",
    "translationEn": "It is He who made the earth tame for you - so walk among its slopes and eat of His provision - and to Him is the resurrection.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/5256.mp3"
  },
  {
    "surah": 105,
    "ayah": 1,
    "textUthmani": "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَٰبِ ٱلْفِيلِ",
    "textSimple": "ألم تر كيف فعل ربك بأصحاب الفيل",
    "translationEn": "Have you not considered, [O Muhammad], how your Lord dealt with the companions of the elephant?",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6189.mp3"
  },
  {
    "surah": 105,
    "ayah": 2,
    "textUthmani": "أَلَمْ يَجْعَلْ كَيْدَهُمْ فِى تَضْلِيلٍۢ",
    "textSimple": "ألم يجعل كيدهم في تضليل",
    "translationEn": "Did He not make their plan into misguidance?",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6190.mp3"
  },
  {
    "surah": 105,
    "ayah": 3,
    "textUthmani": "وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ",
    "textSimple": "وأرسل عليهم طيرا أبابيل",
    "translationEn": "And He sent against them birds in flocks,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6191.mp3"
  },
  {
    "surah": 105,
    "ayah": 4,
    "textUthmani": "تَرْمِيهِم بِحِجَارَةٍۢ مِّن سِجِّيلٍۢ",
    "textSimple": "ترميهم بحجارة من سجيل",
    "translationEn": "Striking them with stones of hard clay,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6192.mp3"
  },
  {
    "surah": 105,
    "ayah": 5,
    "textUthmani": "فَجَعَلَهُمْ كَعَصْفٍۢ مَّأْكُولٍۭ",
    "textSimple": "فجعلهم كعصف مأكول",
    "translationEn": "And He made them like eaten straw.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6193.mp3"
  },
  {
    "surah": 106,
    "ayah": 1,
    "textUthmani": "لِإِيلَٰفِ قُرَيْشٍ",
    "textSimple": "لإيلاف قريش",
    "translationEn": "For the accustomed security of the Quraysh -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6194.mp3"
  },
  {
    "surah": 106,
    "ayah": 2,
    "textUthmani": "إِۦلَٰفِهِمْ رِحْلَةَ ٱلشِّتَآءِ وَٱلصَّيْفِ",
    "textSimple": "إيلافهم رحلة الشتاء والصيف",
    "translationEn": "Their accustomed security [in] the caravan of winter and summer -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6195.mp3"
  },
  {
    "surah": 106,
    "ayah": 3,
    "textUthmani": "فَلْيَعْبُدُوا۟ رَبَّ هَٰذَا ٱلْبَيْتِ",
    "textSimple": "فليعبدوا رب هذا البيت",
    "translationEn": "Let them worship the Lord of this House,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6196.mp3"
  },
  {
    "surah": 106,
    "ayah": 4,
    "textUthmani": "ٱلَّذِىٓ أَطْعَمَهُم مِّن جُوعٍۢ وَءَامَنَهُم مِّنْ خَوْفٍۭ",
    "textSimple": "الذي أطعمهم من جوع وآمنهم من خوف",
    "translationEn": "Who has fed them, [saving them] from hunger and made them safe, [saving them] from fear.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6197.mp3"
  },
  {
    "surah": 107,
    "ayah": 1,
    "textUthmani": "أَرَءَيْتَ ٱلَّذِى يُكَذِّبُ بِٱلدِّينِ",
    "textSimple": "أرأيت الذي يكذب بالدين",
    "translationEn": "Have you seen the one who denies the Recompense?",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6198.mp3"
  },
  {
    "surah": 107,
    "ayah": 2,
    "textUthmani": "فَذَٰلِكَ ٱلَّذِى يَدُعُّ ٱلْيَتِيمَ",
    "textSimple": "فذلك الذي يدع اليتيم",
    "translationEn": "For that is the one who drives away the orphan",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6199.mp3"
  },
  {
    "surah": 107,
    "ayah": 3,
    "textUthmani": "وَلَا يَحُضُّ عَلَىٰ طَعَامِ ٱلْمِسْكِينِ",
    "textSimple": "ولا يحض على طعام المسكين",
    "translationEn": "And does not encourage the feeding of the poor.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6200.mp3"
  },
  {
    "surah": 107,
    "ayah": 4,
    "textUthmani": "فَوَيْلٌۭ لِّلْمُصَلِّينَ",
    "textSimple": "فويل للمصلين",
    "translationEn": "So woe to those who pray",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6201.mp3"
  },
  {
    "surah": 107,
    "ayah": 5,
    "textUthmani": "ٱلَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ",
    "textSimple": "الذين هم عن صلاتهم ساهون",
    "translationEn": "[But] who are heedless of their prayer -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6202.mp3"
  },
  {
    "surah": 107,
    "ayah": 6,
    "textUthmani": "ٱلَّذِينَ هُمْ يُرَآءُونَ",
    "textSimple": "الذين هم يراءون",
    "translationEn": "Those who make show [of their deeds]",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6203.mp3"
  },
  {
    "surah": 107,
    "ayah": 7,
    "textUthmani": "وَيَمْنَعُونَ ٱلْمَاعُونَ",
    "textSimple": "ويمنعون الماعون",
    "translationEn": "And withhold [simple] assistance.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6204.mp3"
  },
  {
    "surah": 108,
    "ayah": 1,
    "textUthmani": "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ",
    "textSimple": "إنا أعطيناك الكوثر",
    "translationEn": "Indeed, We have granted you, [O Muhammad], al-Kawthar.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6205.mp3"
  },
  {
    "surah": 108,
    "ayah": 2,
    "textUthmani": "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
    "textSimple": "فصل لربك وانحر",
    "translationEn": "So pray to your Lord and sacrifice [to Him alone].",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6206.mp3"
  },
  {
    "surah": 108,
    "ayah": 3,
    "textUthmani": "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
    "textSimple": "إن شانئك هو الأبتر",
    "translationEn": "Indeed, your enemy is the one cut off.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6207.mp3"
  },
  {
    "surah": 109,
    "ayah": 1,
    "textUthmani": "قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ",
    "textSimple": "قل يا أيها الكافرون",
    "translationEn": "Say, \"O disbelievers,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6208.mp3"
  },
  {
    "surah": 109,
    "ayah": 2,
    "textUthmani": "لَآ أَعْبُدُ مَا تَعْبُدُونَ",
    "textSimple": "لا أعبد ما تعبدون",
    "translationEn": "I do not worship what you worship.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6209.mp3"
  },
  {
    "surah": 109,
    "ayah": 3,
    "textUthmani": "وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ",
    "textSimple": "ولا أنتم عابدون ما أعبد",
    "translationEn": "Nor are you worshippers of what I worship.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6210.mp3"
  },
  {
    "surah": 109,
    "ayah": 4,
    "textUthmani": "وَلَآ أَنَا۠ عَابِدٌۭ مَّا عَبَدتُّمْ",
    "textSimple": "ولا أنا عابد ما عبدتم",
    "translationEn": "Nor will I be a worshipper of what you worship.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6211.mp3"
  },
  {
    "surah": 109,
    "ayah": 5,
    "textUthmani": "وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ",
    "textSimple": "ولا أنتم عابدون ما أعبد",
    "translationEn": "Nor will you be worshippers of what I worship.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6212.mp3"
  },
  {
    "surah": 109,
    "ayah": 6,
    "textUthmani": "لَكُمْ دِينُكُمْ وَلِىَ دِينِ",
    "textSimple": "لكم دينكم ولي دين",
    "translationEn": "For you is your religion, and for me is my religion.\"",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6213.mp3"
  },
  {
    "surah": 110,
    "ayah": 1,
    "textUthmani": "إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ",
    "textSimple": "إذا جاء نصر الله والفتح",
    "translationEn": "When the victory of Allah has come and the conquest,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6214.mp3"
  },
  {
    "surah": 110,
    "ayah": 2,
    "textUthmani": "وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًۭا",
    "textSimple": "ورأيت الناس يدخلون في دين الله أفواجا",
    "translationEn": "And you see the people entering into the religion of Allah in multitudes,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6215.mp3"
  },
  {
    "surah": 110,
    "ayah": 3,
    "textUthmani": "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ ۚ إِنَّهُۥ كَانَ تَوَّابًۢا",
    "textSimple": "فسبح بحمد ربك واستغفره ۚ إنه كان توابا",
    "translationEn": "Then exalt [Him] with praise of your Lord and ask forgiveness of Him. Indeed, He is ever Accepting of repentance.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6216.mp3"
  },
  {
    "surah": 111,
    "ayah": 1,
    "textUthmani": "تَبَّتْ يَدَآ أَبِى لَهَبٍۢ وَتَبَّ",
    "textSimple": "تبت يدا أبي لهب وتب",
    "translationEn": "May the hands of Abu Lahab be ruined, and ruined is he.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6217.mp3"
  },
  {
    "surah": 111,
    "ayah": 2,
    "textUthmani": "مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ",
    "textSimple": "ما أغنى عنه ماله وما كسب",
    "translationEn": "His wealth will not avail him or that which he gained.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6218.mp3"
  },
  {
    "surah": 111,
    "ayah": 3,
    "textUthmani": "سَيَصْلَىٰ نَارًۭا ذَاتَ لَهَبٍۢ",
    "textSimple": "سيصلى نارا ذات لهب",
    "translationEn": "He will [enter to] burn in a Fire of [blazing] flame",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6219.mp3"
  },
  {
    "surah": 111,
    "ayah": 4,
    "textUthmani": "وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ",
    "textSimple": "وامرأته حمالة الحطب",
    "translationEn": "And his wife [as well] - the carrier of firewood.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6220.mp3"
  },
  {
    "surah": 111,
    "ayah": 5,
    "textUthmani": "فِى جِيدِهَا حَبْلٌۭ مِّن مَّسَدٍۭ",
    "textSimple": "في جيدها حبل من مسد",
    "translationEn": "Around her neck is a rope of [twisted] fiber.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6221.mp3"
  },
  {
    "surah": 112,
    "ayah": 1,
    "textUthmani": "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    "textSimple": "قل هو الله أحد",
    "translationEn": "Say, \"He is Allah, [who is] One,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6222.mp3"
  },
  {
    "surah": 112,
    "ayah": 2,
    "textUthmani": "ٱللَّهُ ٱلصَّمَدُ",
    "textSimple": "الله الصمد",
    "translationEn": "Allah, the Eternal Refuge.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6223.mp3"
  },
  {
    "surah": 112,
    "ayah": 3,
    "textUthmani": "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    "textSimple": "لم يلد ولم يولد",
    "translationEn": "He neither begets nor is born,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6224.mp3"
  },
  {
    "surah": 112,
    "ayah": 4,
    "textUthmani": "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
    "textSimple": "ولم يكن له كفوا أحد",
    "translationEn": "Nor is there to Him any equivalent.\"",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6225.mp3"
  },
  {
    "surah": 113,
    "ayah": 1,
    "textUthmani": "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
    "textSimple": "قل أعوذ برب الفلق",
    "translationEn": "Say, \"I seek refuge in the Lord of daybreak",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6226.mp3"
  },
  {
    "surah": 113,
    "ayah": 2,
    "textUthmani": "مِن شَرِّ مَا خَلَقَ",
    "textSimple": "من شر ما خلق",
    "translationEn": "From the evil of that which He created",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6227.mp3"
  },
  {
    "surah": 113,
    "ayah": 3,
    "textUthmani": "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    "textSimple": "ومن شر غاسق إذا وقب",
    "translationEn": "And from the evil of darkness when it settles",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6228.mp3"
  },
  {
    "surah": 113,
    "ayah": 4,
    "textUthmani": "وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ",
    "textSimple": "ومن شر النفاثات في العقد",
    "translationEn": "And from the evil of the blowers in knots",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6229.mp3"
  },
  {
    "surah": 113,
    "ayah": 5,
    "textUthmani": "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    "textSimple": "ومن شر حاسد إذا حسد",
    "translationEn": "And from the evil of an envier when he envies.\"",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6230.mp3"
  },
  {
    "surah": 114,
    "ayah": 1,
    "textUthmani": "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
    "textSimple": "قل أعوذ برب الناس",
    "translationEn": "Say, \"I seek refuge in the Lord of mankind,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6231.mp3"
  },
  {
    "surah": 114,
    "ayah": 2,
    "textUthmani": "مَلِكِ ٱلنَّاسِ",
    "textSimple": "ملك الناس",
    "translationEn": "The Sovereign of mankind.",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6232.mp3"
  },
  {
    "surah": 114,
    "ayah": 3,
    "textUthmani": "إِلَٰهِ ٱلنَّاسِ",
    "textSimple": "إله الناس",
    "translationEn": "The God of mankind,",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6233.mp3"
  },
  {
    "surah": 114,
    "ayah": 4,
    "textUthmani": "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
    "textSimple": "من شر الوسواس الخناس",
    "translationEn": "From the evil of the retreating whisperer -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6234.mp3"
  },
  {
    "surah": 114,
    "ayah": 5,
    "textUthmani": "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
    "textSimple": "الذي يوسوس في صدور الناس",
    "translationEn": "Who whispers [evil] into the breasts of mankind -",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6235.mp3"
  },
  {
    "surah": 114,
    "ayah": 6,
    "textUthmani": "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
    "textSimple": "من الجنة والناس",
    "translationEn": "From among the jinn and mankind.\"",
    "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.husary/6236.mp3"
  }
];
