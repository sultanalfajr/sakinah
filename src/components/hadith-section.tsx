"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpenText, Copy, MoonStar, PenLine } from "lucide-react";
import { toast } from "sonner";
import {
  HADITHS,
  HADITH_CATEGORIES,
  hadithOfTheNight,
  type Hadith,
} from "@/data/hadiths";

const GLASS_CARD =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md";

function HadithCard({ hadith, featured }: { hadith: Hadith; featured?: boolean }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${hadith.text}\n— ${hadith.narrator ? `عن ${hadith.narrator}` : "حديث نبوي"} · ${hadith.source}`
      );
      toast.success("نُسخ الحديث");
    } catch {
      toast.error("تعذّر النسخ — جرّب مرة أخرى");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${GLASS_CARD} relative break-inside-avoid p-5 sm:p-6`}
    >
      {/* زخرفة علوية */}
      <span
        aria-hidden="true"
        className="font-display pointer-events-none absolute -top-1 start-4 select-none text-4xl text-teal-300/20"
      >
        ﴾
      </span>

      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-teal-300/10 px-3 py-1 text-[11px] text-teal-200/90 ring-1 ring-teal-300/25">
          {hadith.category}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="نسخ الحديث"
          className="rounded-full p-2 text-teal-100/40 transition hover:bg-white/5 hover:text-teal-200"
        >
          <Copy className="size-4" aria-hidden="true" />
        </button>
      </div>

      <p
        className={`font-display mt-4 leading-loose text-teal-50 ${
          featured ? "text-xl sm:text-2xl" : "text-lg"
        }`}
      >
        {hadith.text}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 pt-3 text-xs text-teal-100/50">
        {hadith.narrator && (
          <span className="text-teal-100/70">عن {hadith.narrator}</span>
        )}
        <span className="flex items-center gap-1.5">
          <BookOpenText className="size-3.5" aria-hidden="true" />
          {hadith.source}
        </span>
      </div>
    </motion.article>
  );
}

export function HadithSection() {
  const [category, setCategory] = useState<string | null>(null);
  const featured = useMemo(() => hadithOfTheNight(), []);

  const filtered = useMemo(
    () => (category ? HADITHS.filter((h) => h.category === category) : HADITHS),
    [category]
  );

  return (
    <section id="hadith" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* الترويسة */}
        <span className="flex items-center gap-1.5 text-sm tracking-wide text-teal-300/80">
          <MoonStar className="size-4" aria-hidden="true" />
          نورٌ قبل النوم
        </span>
        <h2 className="font-display mt-2 text-3xl text-teal-50 sm:text-4xl">
          الأحاديثُ والأذكار — سَكِينَةُ القلب
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-teal-100/60">
          منتخباتٌ صحيحة من كلام النبي ﷺ في أذكار النوم والتحصين وطمأنينة
          الصدر — اقرأها قبل أن تغمض عينيك، أو انسخها وشاركها.
        </p>

        {/* حديث الليلة */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 rounded-2xl border border-teal-300/20 bg-gradient-to-b from-teal-300/[0.07] to-transparent p-6 sm:p-8 backdrop-blur-md"
        >
          <div className="flex items-center gap-2 text-xs text-teal-300/80">
            <MoonStar className="size-4" aria-hidden="true" />
            <span>حديثُ الليلة</span>
            <span className="h-px flex-1 bg-teal-300/15" aria-hidden="true" />
          </div>
          <div className="mt-4">
            <HadithCard hadith={featured} featured />
          </div>
        </motion.div>

        {/* التصنيفات */}
        <div
          className="mt-8 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="تصفية الأحاديث بالتصنيف"
        >
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={`rounded-full px-4 py-1.5 text-sm transition-all duration-300 ${
              category === null
                ? "bg-teal-300/20 text-teal-100 ring-1 ring-teal-300/50"
                : "text-teal-100/50 hover:bg-white/5 hover:text-teal-100"
            }`}
          >
            الكل
          </button>
          {HADITH_CATEGORIES.map((c) => {
            const count = HADITHS.filter((h) => h.category === c).length;
            if (count === 0) return null;
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(active ? null : c)}
                aria-pressed={active}
                className={`rounded-full px-4 py-1.5 text-sm transition-all duration-300 ${
                  active
                    ? "bg-teal-300/20 text-teal-100 ring-1 ring-teal-300/50"
                    : "text-teal-100/50 hover:bg-white/5 hover:text-teal-100"
                }`}
              >
                {c}
                <span className="ms-1.5 text-[10px] text-teal-100/40">
                  {new Intl.NumberFormat("ar-EG").format(count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* شبكة الأحاديث */}
        <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
          {filtered.map((h) => (
            <HadithCard key={h.id} hadith={h} />
          ))}
        </div>

        {/* دعوة للتوسعة */}
        <p className="mt-8 flex items-center gap-2 text-xs leading-relaxed text-teal-100/40">
          <PenLine className="size-3.5 shrink-0" aria-hidden="true" />
          هذه مجموعةٌ افتتاحية موثّقة، وستُضاف عشرات الأحاديث تدريجيًا — كل
          حديثٍ صحيحٍ يُرسل يصل مكانَه هنا.
        </p>
      </div>
    </section>
  );
}

export default HadithSection;
