"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ListMusic,
  Play,
  Search,
  SortAsc,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  QURAN_PLAYLISTS,
  arabicNumerals,
  playlistById,
} from "@/lib/quran";
import { ALL_SURAHS, type Surah } from "@/data/surahs";

const FAVS_KEY = "sakinah:surah-favs";

type FilterId = "all" | "مكية" | "مدنية" | "short" | "favs";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "مكية", label: "مكية" },
  { id: "مدنية", label: "مدنية" },
  { id: "short", label: "قصيرة" },
  { id: "favs", label: "المفضلة" },
];

function MiniEqualizer() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="block w-[3px] rounded-full bg-teal-300"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            animation: `eq 1.1s ease-in-out ${bar * 0.18}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

export function QuranBrowser({
  currentSurah,
  playing,
  loading,
  onPlay,
  onVisibleListChange,
}: {
  currentSurah: number | null;
  playing: boolean;
  loading: boolean;
  onPlay: (surah: number) => void;
  /** يخبر المشغّل بالقائمة الظاهرة حاليًا (للتتابع والتقديم) */
  onVisibleListChange?: (list: number[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [sortShort, setSortShort] = useState(false);
  const [favs, setFavs] = useState<number[]>([]);

  /* استرجاع المفضلة بعد التركيب (تفادي اختلاف الخادم) */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- تهيئة بعد التركيب لتفادي اختلاف الخادم عن المتصفح
          setFavs(parsed.filter((x) => typeof x === "number"));
        }
      }
    } catch {
      /* تجاهل */
    }
  }, []);

  const toggleFav = (n: number) => {
    setFavs((prev) => {
      const next = prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n];
      try {
        window.localStorage.setItem(FAVS_KEY, JSON.stringify(next));
      } catch {
        /* تجاهل */
      }
      return next;
    });
  };

  const playlist = playlistId ? playlistById(playlistId) : undefined;

  const visible: Surah[] = useMemo(() => {
    let base: Surah[];
    if (playlist) {
      base = playlist.surahs
        .map((n) => ALL_SURAHS.find((s) => s.n === n))
        .filter((s): s is Surah => Boolean(s));
    } else {
      base = ALL_SURAHS;
    }

    let result = base;
    if (filter === "favs") result = result.filter((s) => favs.includes(s.n));
    else if (filter === "short") result = result.filter((s) => s.ayahs <= 10);
    else if (filter !== "all") result = result.filter((s) => s.type === filter);

    const q = query.trim();
    if (q) {
      const asNumber = Number(q);
      const isNum = Number.isInteger(asNumber);
      const lower = q.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.includes(q) ||
          s.latin.toLowerCase().includes(lower) ||
          (isNum && s.n === asNumber)
      );
    }

    if (sortShort && !playlist) {
      result = [...result].sort((a, b) => a.ayahs - b.ayahs || a.n - b.n);
    }
    return result;
  }, [playlist, filter, favs, query, sortShort]);

  /* إبلاغ المشغّل بالقائمة الظاهرة */
  useEffect(() => {
    onVisibleListChange?.(visible.map((s) => s.n));
  }, [visible, onVisibleListChange]);

  return (
    <div>
      {/* سلاسل النوم */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-teal-300/80">
          <Sparkles className="size-3.5" aria-hidden="true" />
          سلاسلُ النوم
        </span>
        {QURAN_PLAYLISTS.map((p) => {
          const active = playlistId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlaylistId(active ? null : p.id)}
              aria-pressed={active}
              title={p.description}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-all duration-300 ${
                active
                  ? "border-teal-300/60 bg-teal-300/15 text-teal-100"
                  : "border-white/10 bg-white/[0.03] text-teal-100/60 hover:border-teal-300/40 hover:text-teal-100"
              }`}
            >
              <ListMusic className="size-3.5" aria-hidden="true" />
              {p.name}
              <span className="text-[10px] text-teal-100/40">
                {arabicNumerals(p.surahs.length)}
              </span>
            </button>
          );
        })}
      </div>

      {/* البحث والترتيب */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-teal-100/40"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن سورة بالاسم أو الرقم…"
            aria-label="البحث في السور"
            className="rounded-xl border-white/10 bg-white/[0.03] pe-9 text-teal-50 placeholder:text-teal-100/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح البحث"
              className="absolute start-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-teal-100/40 hover:text-teal-100"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSortShort((v) => !v)}
          aria-pressed={sortShort}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs transition ${
            sortShort
              ? "border-teal-300/50 bg-teal-300/10 text-teal-100"
              : "border-white/10 bg-white/[0.03] text-teal-100/60 hover:text-teal-100"
          }`}
        >
          <SortAsc className="size-3.5 rotate-180" aria-hidden="true" />
          الأقصرُ أولًا
        </button>
      </div>

      {/* التصفية */}
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="تصفية السور">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count =
            f.id === "favs"
              ? favs.length
              : f.id === "short"
                ? undefined
                : undefined;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-all duration-300 ${
                active
                  ? "bg-teal-300/20 text-teal-100 ring-1 ring-teal-300/50"
                  : "text-teal-100/50 hover:bg-white/5 hover:text-teal-100"
              }`}
            >
              {f.label}
              {typeof count === "number" && count > 0 && (
                <span className="ms-1 text-[10px] text-teal-100/40">
                  {arabicNumerals(count)}
                </span>
              )}
            </button>
          );
        })}
        <span className="ms-auto text-[11px] tabular-nums text-teal-100/40">
          تظهرُ {arabicNumerals(visible.length)} من {arabicNumerals(114)} سورة
        </span>
      </div>

      {/* شبكة السور */}
      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-10 text-center">
          <BookOpen className="size-8 text-teal-100/30" aria-hidden="true" />
          <p className="text-sm text-teal-100/50">
            لا توجد نتائج — جرّب اسمًا آخر أو غيّر التصفية
          </p>
        </div>
      ) : (
        <div className="mt-5 max-h-[26rem] overflow-y-auto pe-1">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((s) => {
              const isActive = currentSurah === s.n;
              const isFav = favs.includes(s.n);
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex items-center gap-1 rounded-xl border p-2 transition-colors duration-300 ${
                    isActive
                      ? "border-teal-300/50 bg-teal-300/10"
                      : "border-white/[0.07] bg-white/[0.03] hover:border-teal-300/30 hover:bg-white/[0.05]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onPlay(s.n)}
                    aria-label={`تشغيل سورة ${s.name}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-start"
                  >
                    <span
                      className={`font-display flex size-9 shrink-0 items-center justify-center rounded-full border text-sm transition ${
                        isActive
                          ? "border-teal-300/60 bg-teal-300/20 text-teal-100"
                          : "border-white/15 bg-white/[0.04] text-teal-100/80 group-hover:border-teal-300/40"
                      }`}
                      aria-hidden="true"
                    >
                      {arabicNumerals(s.n)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-display block truncate text-[15px] text-teal-50">
                        {s.name}
                      </span>
                      <span className="block text-[10px] text-teal-100/45">
                        {arabicNumerals(s.ayahs)} آية · {s.type}
                      </span>
                    </span>
                    {isActive &&
                      (loading ? (
                        <span className="size-2 shrink-0 animate-pulse rounded-full bg-teal-300" />
                      ) : playing ? (
                        <MiniEqualizer />
                      ) : (
                        <Play className="size-3.5 shrink-0 text-teal-300" aria-hidden="true" />
                      ))}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFav(s.n)}
                    aria-label={
                      isFav ? `إزالة ${s.name} من المفضلة` : `إضافة ${s.name} إلى المفضلة`
                    }
                    aria-pressed={isFav}
                    className="shrink-0 rounded-full p-1.5 text-teal-100/30 transition hover:bg-white/5 hover:text-teal-200"
                  >
                    <Star
                      className={`size-3.5 ${isFav ? "fill-amber-300 text-amber-300" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
