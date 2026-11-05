/**
 * فهرس التلاوات — القرّاء والسور الـ114 وسلاسل النوم.
 *
 * تعمل التلاوات افتراضيًا من مصادر مجانية مفتوحة (بلا أي مفتاح API):
 *   1. ملفات محلية رفعتها أنت: public/quran/{معرّف-القارئ}/{رقم-السورة}.mp3
 *   2. cdn.mp3quran.net  (مكتبة mp3quran العامة)
 *   3. cdn.islamic.network (مشروع القرآن المفتوح)
 * إن فشل مصدر ينتقل المشغّل تلقائيًا إلى التالي.
 */

import { ALL_SURAHS, type Surah } from "@/data/surahs";

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

/* السور الـ114 كاملة — من بيانات المصحف */
export const QURAN_SURAHS: Surah[] = ALL_SURAHS;

/** سلسلة نوم منسّقة — مجموعة سور تُشغَّل بتتابع قبل النوم */
export type QuranPlaylist = {
  id: string;
  name: string;
  description: string;
  surahs: number[];
};

export const QURAN_PLAYLISTS: QuranPlaylist[] = [
  {
    id: "sleep",
    name: "سورُ النوم",
    description: "منتقاة للتلاوة قبل النوم — رقاقٌ وطمأنينة",
    surahs: [
      1, 12, 18, 19, 20, 32, 36, 44, 55, 56, 67, 73, 78, 112, 113, 114,
    ],
  },
  {
    id: "tahseen",
    name: "التحصين",
    description: "المعوذات والفاتحة — تحصينُ الليل كاملًا",
    surahs: [1, 112, 113, 114],
  },
  {
    id: "hearts",
    name: "قلوبٌ مطمئنة",
    description: "سور الرقاق التي تُسكِن القلب قبل العينين",
    surahs: [32, 36, 44, 55, 67, 73],
  },
  {
    id: "short",
    name: "قصارُ السور",
    description: "سورٌ قصيرة تُختم بها الليلة بهدوء",
    surahs: [
      93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
      109, 110, 111, 112, 113, 114,
    ],
  },
  {
    id: "juz30",
    name: "جزء تبارك",
    description: "من النبأ إلى الناس — كامل الجزء الأخير",
    surahs: Array.from({ length: 37 }, (_, i) => i + 78),
  },
];

export function playlistById(id: string): QuranPlaylist | undefined {
  return QURAN_PLAYLISTS.find((p) => p.id === id);
}

export function surahName(n: number): string {
  return QURAN_SURAHS.find((s) => s.n === n)?.name ?? `سورة ${n}`;
}

export function surahByNumber(n: number): Surah | undefined {
  return QURAN_SURAHS.find((s) => s.n === n);
}

export function reciterById(id: string): QuranReciter {
  return QURAN_RECITERS.find((r) => r.id === id) ?? QURAN_RECITERS[0];
}

/** تحويل رقم إلى أرقام عربية-هندية للزخرفة: 67 → ٦٧ */
export function arabicNumerals(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
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
  return `${arabicNumerals(m)}:${String(s).padStart(2, "0").replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)])}`;
}
