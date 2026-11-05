/**
 * سور القرآن الكريم الـ114 — البيانات الكاملة.
 * الترتيب المصحفي مع عدد الآيات ونوع الوحي (مكية / مدنية).
 */

export type SurahRevelation = "مكية" | "مدنية";

export type Surah = {
  /** الرقم المصحفي 1..114 */
  n: number;
  /** الاسم بالعربية كما في المصحف */
  name: string;
  /** النقل اللاتيني (للمساعدة في البحث أحيانًا) */
  latin: string;
  /** عدد الآيات */
  ayahs: number;
  /** نوع الوحي */
  type: SurahRevelation;
};

export const ALL_SURAHS: Surah[] = [
  { n: 1, name: "الفاتحة", latin: "Al-Fatihah", ayahs: 7, type: "مكية" },
  { n: 2, name: "البقرة", latin: "Al-Baqarah", ayahs: 286, type: "مدنية" },
  { n: 3, name: "آل عمران", latin: "Ali Imran", ayahs: 200, type: "مدنية" },
  { n: 4, name: "النساء", latin: "An-Nisa", ayahs: 176, type: "مدنية" },
  { n: 5, name: "المائدة", latin: "Al-Ma'idah", ayahs: 120, type: "مدنية" },
  { n: 6, name: "الأنعام", latin: "Al-An'am", ayahs: 165, type: "مكية" },
  { n: 7, name: "الأعراف", latin: "Al-A'raf", ayahs: 206, type: "مكية" },
  { n: 8, name: "الأنفال", latin: "Al-Anfal", ayahs: 75, type: "مدنية" },
  { n: 9, name: "التوبة", latin: "At-Tawbah", ayahs: 129, type: "مدنية" },
  { n: 10, name: "يونس", latin: "Yunus", ayahs: 109, type: "مكية" },
  { n: 11, name: "هود", latin: "Hud", ayahs: 123, type: "مكية" },
  { n: 12, name: "يوسف", latin: "Yusuf", ayahs: 111, type: "مكية" },
  { n: 13, name: "الرعد", latin: "Ar-Ra'd", ayahs: 43, type: "مدنية" },
  { n: 14, name: "إبراهيم", latin: "Ibrahim", ayahs: 52, type: "مكية" },
  { n: 15, name: "الحجر", latin: "Al-Hijr", ayahs: 99, type: "مكية" },
  { n: 16, name: "النحل", latin: "An-Nahl", ayahs: 128, type: "مكية" },
  { n: 17, name: "الإسراء", latin: "Al-Isra", ayahs: 111, type: "مكية" },
  { n: 18, name: "الكهف", latin: "Al-Kahf", ayahs: 110, type: "مكية" },
  { n: 19, name: "مريم", latin: "Maryam", ayahs: 98, type: "مكية" },
  { n: 20, name: "طه", latin: "Taha", ayahs: 135, type: "مكية" },
  { n: 21, name: "الأنبياء", latin: "Al-Anbiya", ayahs: 112, type: "مكية" },
  { n: 22, name: "الحج", latin: "Al-Hajj", ayahs: 78, type: "مدنية" },
  { n: 23, name: "المؤمنون", latin: "Al-Mu'minun", ayahs: 118, type: "مكية" },
  { n: 24, name: "النور", latin: "An-Nur", ayahs: 64, type: "مدنية" },
  { n: 25, name: "الفرقان", latin: "Al-Furqan", ayahs: 77, type: "مكية" },
  { n: 26, name: "الشعراء", latin: "Ash-Shu'ara", ayahs: 227, type: "مكية" },
  { n: 27, name: "النمل", latin: "An-Naml", ayahs: 93, type: "مكية" },
  { n: 28, name: "القصص", latin: "Al-Qasas", ayahs: 88, type: "مكية" },
  { n: 29, name: "العنكبوت", latin: "Al-Ankabut", ayahs: 69, type: "مكية" },
  { n: 30, name: "الروم", latin: "Ar-Rum", ayahs: 60, type: "مكية" },
  { n: 31, name: "لقمان", latin: "Luqman", ayahs: 34, type: "مكية" },
  { n: 32, name: "السجدة", latin: "As-Sajdah", ayahs: 30, type: "مكية" },
  { n: 33, name: "الأحزاب", latin: "Al-Ahzab", ayahs: 73, type: "مدنية" },
  { n: 34, name: "سبأ", latin: "Saba", ayahs: 54, type: "مكية" },
  { n: 35, name: "فاطر", latin: "Fatir", ayahs: 45, type: "مكية" },
  { n: 36, name: "يس", latin: "Ya-Sin", ayahs: 83, type: "مكية" },
  { n: 37, name: "الصافات", latin: "As-Saffat", ayahs: 182, type: "مكية" },
  { n: 38, name: "ص", latin: "Sad", ayahs: 88, type: "مكية" },
  { n: 39, name: "الزمر", latin: "Az-Zumar", ayahs: 75, type: "مكية" },
  { n: 40, name: "غافر", latin: "Ghafir", ayahs: 85, type: "مكية" },
  { n: 41, name: "فصلت", latin: "Fussilat", ayahs: 54, type: "مكية" },
  { n: 42, name: "الشورى", latin: "Ash-Shura", ayahs: 53, type: "مكية" },
  { n: 43, name: "الزخرف", latin: "Az-Zukhruf", ayahs: 89, type: "مكية" },
  { n: 44, name: "الدخان", latin: "Ad-Dukhan", ayahs: 59, type: "مكية" },
  { n: 45, name: "الجاثية", latin: "Al-Jathiyah", ayahs: 37, type: "مكية" },
  { n: 46, name: "الأحقاف", latin: "Al-Ahqaf", ayahs: 35, type: "مكية" },
  { n: 47, name: "محمد", latin: "Muhammad", ayahs: 38, type: "مدنية" },
  { n: 48, name: "الفتح", latin: "Al-Fath", ayahs: 29, type: "مدنية" },
  { n: 49, name: "الحجرات", latin: "Al-Hujurat", ayahs: 18, type: "مدنية" },
  { n: 50, name: "ق", latin: "Qaf", ayahs: 45, type: "مكية" },
  { n: 51, name: "الذاريات", latin: "Adh-Dhariyat", ayahs: 60, type: "مكية" },
  { n: 52, name: "الطور", latin: "At-Tur", ayahs: 49, type: "مكية" },
  { n: 53, name: "النجم", latin: "An-Najm", ayahs: 62, type: "مكية" },
  { n: 54, name: "القمر", latin: "Al-Qamar", ayahs: 55, type: "مكية" },
  { n: 55, name: "الرحمن", latin: "Ar-Rahman", ayahs: 78, type: "مدنية" },
  { n: 56, name: "الواقعة", latin: "Al-Waqi'ah", ayahs: 96, type: "مكية" },
  { n: 57, name: "الحديد", latin: "Al-Hadid", ayahs: 29, type: "مدنية" },
  { n: 58, name: "المجادلة", latin: "Al-Mujadila", ayahs: 22, type: "مدنية" },
  { n: 59, name: "الحشر", latin: "Al-Hashr", ayahs: 24, type: "مدنية" },
  { n: 60, name: "الممتحنة", latin: "Al-Mumtahanah", ayahs: 13, type: "مدنية" },
  { n: 61, name: "الصف", latin: "As-Saff", ayahs: 14, type: "مدنية" },
  { n: 62, name: "الجمعة", latin: "Al-Jumu'ah", ayahs: 11, type: "مدنية" },
  { n: 63, name: "المنافقون", latin: "Al-Munafiqun", ayahs: 11, type: "مدنية" },
  { n: 64, name: "التغابن", latin: "At-Taghabun", ayahs: 18, type: "مدنية" },
  { n: 65, name: "الطلاق", latin: "At-Talaq", ayahs: 12, type: "مدنية" },
  { n: 66, name: "التحريم", latin: "At-Tahrim", ayahs: 12, type: "مدنية" },
  { n: 67, name: "الملك", latin: "Al-Mulk", ayahs: 30, type: "مكية" },
  { n: 68, name: "القلم", latin: "Al-Qalam", ayahs: 52, type: "مكية" },
  { n: 69, name: "الحاقة", latin: "Al-Haqqah", ayahs: 52, type: "مكية" },
  { n: 70, name: "المعارج", latin: "Al-Ma'arij", ayahs: 44, type: "مكية" },
  { n: 71, name: "نوح", latin: "Nuh", ayahs: 28, type: "مكية" },
  { n: 72, name: "الجن", latin: "Al-Jinn", ayahs: 28, type: "مكية" },
  { n: 73, name: "المزمل", latin: "Al-Muzzammil", ayahs: 20, type: "مكية" },
  { n: 74, name: "المدثر", latin: "Al-Muddaththir", ayahs: 56, type: "مكية" },
  { n: 75, name: "القيامة", latin: "Al-Qiyamah", ayahs: 40, type: "مكية" },
  { n: 76, name: "الإنسان", latin: "Al-Insan", ayahs: 31, type: "مدنية" },
  { n: 77, name: "المرسلات", latin: "Al-Mursalat", ayahs: 50, type: "مكية" },
  { n: 78, name: "النبأ", latin: "An-Naba", ayahs: 40, type: "مكية" },
  { n: 79, name: "النازعات", latin: "An-Nazi'at", ayahs: 46, type: "مكية" },
  { n: 80, name: "عبس", latin: "Abasa", ayahs: 42, type: "مكية" },
  { n: 81, name: "التكوير", latin: "At-Takwir", ayahs: 29, type: "مكية" },
  { n: 82, name: "الانفطار", latin: "Al-Infitar", ayahs: 19, type: "مكية" },
  { n: 83, name: "المطففين", latin: "Al-Mutaffifin", ayahs: 36, type: "مكية" },
  { n: 84, name: "الانشقاق", latin: "Al-Inshiqaq", ayahs: 25, type: "مكية" },
  { n: 85, name: "البروج", latin: "Al-Buruj", ayahs: 22, type: "مكية" },
  { n: 86, name: "الطارق", latin: "At-Tariq", ayahs: 17, type: "مكية" },
  { n: 87, name: "الأعلى", latin: "Al-A'la", ayahs: 19, type: "مكية" },
  { n: 88, name: "الغاشية", latin: "Al-Ghashiyah", ayahs: 26, type: "مكية" },
  { n: 89, name: "الفجر", latin: "Al-Fajr", ayahs: 30, type: "مكية" },
  { n: 90, name: "البلد", latin: "Al-Balad", ayahs: 20, type: "مكية" },
  { n: 91, name: "الشمس", latin: "Ash-Shams", ayahs: 15, type: "مكية" },
  { n: 92, name: "الليل", latin: "Al-Layl", ayahs: 21, type: "مكية" },
  { n: 93, name: "الضحى", latin: "Ad-Duha", ayahs: 11, type: "مكية" },
  { n: 94, name: "الشرح", latin: "Ash-Sharh", ayahs: 8, type: "مكية" },
  { n: 95, name: "التين", latin: "At-Tin", ayahs: 8, type: "مكية" },
  { n: 96, name: "العلق", latin: "Al-Alaq", ayahs: 19, type: "مكية" },
  { n: 97, name: "القدر", latin: "Al-Qadr", ayahs: 5, type: "مكية" },
  { n: 98, name: "البينة", latin: "Al-Bayyinah", ayahs: 8, type: "مدنية" },
  { n: 99, name: "الزلزلة", latin: "Az-Zalzalah", ayahs: 8, type: "مدنية" },
  { n: 100, name: "العاديات", latin: "Al-Adiyat", ayahs: 11, type: "مكية" },
  { n: 101, name: "القارعة", latin: "Al-Qari'ah", ayahs: 11, type: "مكية" },
  { n: 102, name: "التكاثر", latin: "At-Takathur", ayahs: 8, type: "مكية" },
  { n: 103, name: "العصر", latin: "Al-Asr", ayahs: 3, type: "مكية" },
  { n: 104, name: "الهمزة", latin: "Al-Humazah", ayahs: 9, type: "مكية" },
  { n: 105, name: "الفيل", latin: "Al-Fil", ayahs: 5, type: "مكية" },
  { n: 106, name: "قريش", latin: "Quraysh", ayahs: 4, type: "مكية" },
  { n: 107, name: "الماعون", latin: "Al-Ma'un", ayahs: 7, type: "مكية" },
  { n: 108, name: "الكوثر", latin: "Al-Kawthar", ayahs: 3, type: "مكية" },
  { n: 109, name: "الكافرون", latin: "Al-Kafirun", ayahs: 6, type: "مكية" },
  { n: 110, name: "النصر", latin: "An-Nasr", ayahs: 3, type: "مدنية" },
  { n: 111, name: "المسد", latin: "Al-Masad", ayahs: 5, type: "مكية" },
  { n: 112, name: "الإخلاص", latin: "Al-Ikhlas", ayahs: 4, type: "مكية" },
  { n: 113, name: "الفلق", latin: "Al-Falaq", ayahs: 5, type: "مكية" },
  { n: 114, name: "الناس", latin: "An-Nas", ayahs: 6, type: "مكية" },
];

/** البحث بالاسم أو الرقم (يعيد رقم السورة) */
export function findSurah(query: string): Surah | undefined {
  const q = query.trim();
  if (!q) return undefined;
  const asNumber = Number(q);
  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 114) {
    return ALL_SURAHS.find((s) => s.n === asNumber);
  }
  const lower = q.toLowerCase();
  return ALL_SURAHS.find(
    (s) => s.name.includes(q) || s.latin.toLowerCase().includes(lower)
  );
}
