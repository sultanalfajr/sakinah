/**
 * فهرس التلاوات — قرّاء وسور مختارة للنوم.
 *
 * تعمل التلاوات افتراضيًا من مصادر مجانية مفتوحة (بلا أي مفتاح API):
 *   1. ملفات محلية رفعتها أنت: public/quran/{معرّف-القارئ}/{رقم-السورة}.mp3
 *   2. cdn.mp3quran.net  (مكتبة mp3quran العامة)
 *   3. cdn.islamic.network (مشروع القرآن المفتوح)
 * إن فشل مصدر ينتقل المشغّل تلقائيًا إلى التالي.
 */

export type QuranReciter = {
  /** يُستخدم أيضًا كاسم مجلد الملفات المحلية: public/quran/{id}/ */
  id: string;
  name: string;
  /** سلاگ مجلد القارئ في cdn.mp3quran.net/audio/{slug}/r1/ */
  mp3quran?: string;
  /** معرّف الرواية في cdn.islamic.network/quran/audio-surah/128/{edition}/ */
  islamicNet?: string;
};

export const QURAN_RECITERS: QuranReciter[] = [
  {
    id: "mishary-alafasy",
    name: "مشاري راشد العفاسي",
    mp3quran: "mishary-alafasy",
    islamicNet: "ar.alafasy",
  },
  {
    id: "maher-muaiqly",
    name: "ماهر المعيقلي",
    mp3quran: "maher-muaiqly",
  },
  {
    id: "mahmoud-husary",
    name: "محمود خليل الحصري",
    mp3quran: "mahmoud-husary",
    islamicNet: "ar.husary",
  },
  {
    id: "muhammad-minshawi",
    name: "محمد صديق المنشاوي",
    mp3quran: "muhammad-minshawi",
    islamicNet: "ar.minshawi",
  },
  {
    id: "abdulrahman-sudais",
    name: "عبد الرحمن السديس",
    mp3quran: "abdulrahman-sudais",
    islamicNet: "ar.abdurrahmaansudais",
  },
  {
    id: "abdulbasit-murattal",
    name: "عبد الباسط عبد الصمد",
    islamicNet: "ar.abdulbasitmurattal",
  },
];

export type QuranSurah = {
  n: number;
  name: string;
  ayahs: number;
};

/** سور مختارة للسهر والنوم — قصيرة ومعروفة أو من سور الرقاق */
export const QURAN_SURAHS: QuranSurah[] = [
  { n: 1, name: "الفاتحة", ayahs: 7 },
  { n: 12, name: "يوسف", ayahs: 111 },
  { n: 18, name: "الكهف", ayahs: 110 },
  { n: 19, name: "مريم", ayahs: 98 },
  { n: 20, name: "طه", ayahs: 135 },
  { n: 32, name: "السجدة", ayahs: 30 },
  { n: 36, name: "يس", ayahs: 83 },
  { n: 44, name: "الدخان", ayahs: 59 },
  { n: 55, name: "الرحمن", ayahs: 78 },
  { n: 56, name: "الواقعة", ayahs: 96 },
  { n: 67, name: "الملك", ayahs: 30 },
  { n: 73, name: "المزمل", ayahs: 20 },
  { n: 78, name: "النبأ", ayahs: 40 },
  { n: 112, name: "الإخلاص", ayahs: 4 },
  { n: 113, name: "الفلق", ayahs: 5 },
  { n: 114, name: "الناس", ayahs: 6 },
];

export function surahName(n: number): string {
  return QURAN_SURAHS.find((s) => s.n === n)?.name ?? `سورة ${n}`;
}

export function reciterById(id: string): QuranReciter {
  return QURAN_RECITERS.find((r) => r.id === id) ?? QURAN_RECITERS[0];
}

/** الملف المحلي (إن وُجد) — نفس الأصل، بلا CORS */
export function quranLocalUrl(reciterId: string, surah: number): string {
  return `/quran/${reciterId}/${surah}.mp3`;
}

/** قائمة مصادر التلاوة بترتيب التجربة — يجرّبها المشغّل تباعًا عند الفشل */
export function quranSourceUrls(reciter: QuranReciter, surah: number): string[] {
  const padded = String(surah).padStart(3, "0");
  const urls: string[] = [];
  if (reciter.mp3quran) {
    urls.push(
      `https://cdn.mp3quran.net/audio/${reciter.mp3quran}/r1/${padded}.mp3`
    );
  }
  if (reciter.islamicNet) {
    urls.push(
      `https://cdn.islamic.network/quran/audio-surah/128/${reciter.islamicNet}/${surah}.mp3`
    );
  }
  return urls;
}

/** كل مسارات التلاوة المحتملة: المحلي أولًا ثم المصادر البعيدة */
export function quranCandidates(reciter: QuranReciter, surah: number): string[] {
  return [quranLocalUrl(reciter.id, surah), ...quranSourceUrls(reciter, surah)];
}

export function formatRecitationTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "٠:٠٠";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
