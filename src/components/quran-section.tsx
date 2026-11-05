"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookMarked,
  Loader2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  QURAN_RECITERS,
  QURAN_SURAHS,
  formatRecitationTime,
  quranCandidates,
  reciterById,
  surahName,
} from "@/lib/quran";

const GLASS_CARD =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md";

const EQUALIZER_KEYFRAMES = `@keyframes quran-eq { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }`;

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="block w-[3px] rounded-full bg-teal-300"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            animation: `quran-eq 1.1s ease-in-out ${bar * 0.18}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

const clampVolume = (v: number) => Math.min(1, Math.max(0, v));

const RECITER_STORAGE_KEY = "sakinah:reciter";

export function QuranSection() {
  const [reciterId, setReciterId] = useState(QURAN_RECITERS[0].id);
  const [current, setCurrent] = useState<{ surah: number; reciterId: string } | null>(
    null
  );
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(true);
  const [volume, setVolume] = useState(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTokenRef = useRef(0);
  const loopRef = useRef(loop);
  const volumeRef = useRef(volume);
  const gainRef = useRef(1); // مستوى الصوت العام × تلاشي المؤقّت

  /* مزامنة القيم الحيّة مع المراجع */
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  /* تذكّر القارئ المفضّل — لا يمكن قراءة localStorage أثناء العرض على الخادم */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(RECITER_STORAGE_KEY);
      if (saved && QURAN_RECITERS.some((r) => r.id === saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- تهيئة بعد التركيب لتفادي اختلاف الخادم عن المتصفح
        setReciterId(saved);
      }
    } catch {
      /* تجاهل */
    }
  }, []);

  const changeReciter = useCallback((id: string) => {
    setReciterId(id);
    try {
      window.localStorage.setItem(RECITER_STORAGE_KEY, id);
    } catch {
      /* تجاهل */
    }
  }, []);

  const applyVolume = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clampVolume(volumeRef.current * gainRef.current);
    }
  }, []);

  /* مزامنة مستوى صوت التلاوة */
  useEffect(() => {
    volumeRef.current = volume;
    applyVolume();
  }, [volume, applyVolume]);

  /* مستوى الصوت العام وتلاشي المؤقّت */
  useEffect(() => {
    const onGain = (event: Event) => {
      const gain = (event as CustomEvent<{ gain?: number }>).detail?.gain;
      gainRef.current =
        typeof gain === "number" && Number.isFinite(gain)
          ? Math.min(1, Math.max(0, gain))
          : 1;
      applyVolume();
    };
    window.addEventListener("sakinah:gain", onGain);
    return () => window.removeEventListener("sakinah:gain", onGain);
  }, [applyVolume]);
  const stopPlayback = useCallback(() => {
    playTokenRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setLoading(false);
    setCurrent(null);
    setPosition(0);
    setDuration(0);
    window.dispatchEvent(new Event("sakinah:quran-stopped"));
  }, []);

  /* عند إنهاء الجلسة (المؤقّت) أو بدء قصة — نتوقف احترامًا للسكون */
  useEffect(() => {
    const stop = () => stopPlayback();
    window.addEventListener("sakinah:stop-all", stop);
    window.addEventListener("sakinah:story-playing", stop);
    return () => {
      window.removeEventListener("sakinah:stop-all", stop);
      window.removeEventListener("sakinah:story-playing", stop);
    };
  }, [stopPlayback]);

  useEffect(() => {
    return () => {
      playTokenRef.current += 1;
      audioRef.current?.pause();
      audioRef.current = null;
      window.dispatchEvent(new Event("sakinah:quran-stopped"));
    };
  }, []);

  const dispatchState = useCallback((title: string, isPlaying: boolean) => {
    window.dispatchEvent(
      new CustomEvent("sakinah:quran-playing", {
        detail: { title, playing: isPlaying },
      })
    );
  }, []);

  /** يجرّب مصادر التلاوة تباعًا: المحلي ← mp3quran ← islamic.network */
  const startSurah = useCallback(
    (surah: number, rId: string) => {
      const reciter = reciterById(rId);
      const candidates = quranCandidates(reciter, surah);
      const title = `سورة ${surahName(surah)} — ${reciter.name}`;
      const token = ++playTokenRef.current;

      setCurrent({ surah, reciterId: rId });
      setPosition(0);
      setDuration(0);
      setLoading(true);
      dispatchState(title, false);

      const tryIndex = (i: number) => {
        if (playTokenRef.current !== token) return;
        if (i >= candidates.length) {
          playTokenRef.current += 1;
          audioRef.current = null;
          setPlaying(false);
          setLoading(false);
          setCurrent(null);
          window.dispatchEvent(new Event("sakinah:quran-stopped"));
          toast.error(
            "تعذّر الوصول إلى هذه التلاوة — تحقّق من اتصالك بالإنترنت أو ارفع ملفات قارئك محليًا"
          );
          return;
        }

        const audio = new Audio(candidates[i]);
        audio.preload = "auto";
        audioRef.current?.pause();
        audioRef.current = audio;
        audio.volume = clampVolume(volumeRef.current * gainRef.current);

        let advanced = false;
        const cleanup = () => {
          audio.removeEventListener("error", onError);
          audio.removeEventListener("playing", onPlaying);
          audio.removeEventListener("ended", onEnded);
          audio.removeEventListener("timeupdate", onTimeUpdate);
          audio.removeEventListener("loadedmetadata", onMetadata);
        };
        const advance = () => {
          if (advanced || playTokenRef.current !== token) return;
          advanced = true;
          cleanup();
          tryIndex(i + 1);
        };
        const onError = () => advance();
        const onPlaying = () => {
          if (playTokenRef.current !== token) return;
          setLoading(false);
          setPlaying(true);
          dispatchState(title, true);
        };
        const onEnded = () => {
          if (playTokenRef.current !== token) return;
          if (loopRef.current) {
            audio.currentTime = 0;
            audio.play().catch(() => {
              playTokenRef.current += 1;
              setPlaying(false);
              setCurrent(null);
              window.dispatchEvent(new Event("sakinah:quran-stopped"));
            });
          } else {
            stopPlayback();
          }
        };
        const onTimeUpdate = () => {
          if (playTokenRef.current !== token) return;
          setPosition(audio.currentTime);
        };
        const onMetadata = () => {
          if (playTokenRef.current !== token) return;
          setDuration(audio.duration);
        };

        audio.addEventListener("error", onError);
        audio.addEventListener("playing", onPlaying);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onMetadata);
        audio.play().catch(() => advance());
      };

      tryIndex(0);
    },
    [dispatchState, stopPlayback]
  );

  /** تبديل: تشغيل/إيقاف مؤقت/استئناف */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (current && audio && playing) {
      audio.pause();
      setPlaying(false);
      dispatchState(
        `سورة ${surahName(current.surah)} — ${reciterById(current.reciterId).name}`,
        false
      );
      return;
    }
    if (current && audio && !playing) {
      audio.play().catch(() => stopPlayback());
      setPlaying(true);
      dispatchState(
        `سورة ${surahName(current.surah)} — ${reciterById(current.reciterId).name}`,
        true
      );
      return;
    }
    // لا شيء يعمل — ابدأ بأول سورة مختارة (الملك قلب قائمة النوم)
    startSurah(67, reciterId);
  }, [current, playing, reciterId, dispatchState, startSurah, stopPlayback]);

  /* زر التشغيل/الإيقاف من المشغّل المصغّر */
  useEffect(() => {
    const onToggle = () => togglePlay();
    window.addEventListener("sakinah:quran-toggle", onToggle);
    return () => window.removeEventListener("sakinah:quran-toggle", onToggle);
  }, [togglePlay]);

  /** السورة السابقة (delta = -1) أو التالية (delta = +1) في قائمة السور المختارة */
  const skip = useCallback(
    (delta: number) => {
      const list = QURAN_SURAHS;
      const index = current ? list.findIndex((s) => s.n === current.surah) : 10; // الملك
      const nextIndex = ((index + delta) % list.length + list.length) % list.length;
      startSurah(list[nextIndex].n, reciterId);
    },
    [current, reciterId, startSurah]
  );

  const seek = useCallback((value: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(value)) {
      audio.currentTime = value;
      setPosition(value);
    }
  }, []);

  const reciter = reciterById(reciterId);
  const activeTitle = current
    ? `سورة ${surahName(current.surah)} — ${reciterById(current.reciterId).name}`
    : null;

  return (
    <section id="quran" className="relative scroll-mt-20 py-20 sm:py-28">
      <style>{EQUALIZER_KEYFRAMES}</style>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* الترويسة */}
        <span className="text-sm tracking-wide text-teal-300/80">التلاوة</span>
        <h2 className="font-display mt-2 text-3xl text-teal-50 sm:text-4xl">
          القرآنُ الكريم — رفيقُ الليل
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-teal-100/60">
          تلاواتٌ مجانية بلا أي مفتاح، من قارّئك المفضّل — قبل النوم أو مع
          صوتٍ محيطٍ خافت، ويتلاشى مع مؤقّتك تلقائيًا.
        </p>

        <div className={`${GLASS_CARD} mt-10`}>
          {/* اختيار القارئ */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-teal-300">
              <BookMarked className="size-4" aria-hidden="true" />
              <span className="text-sm font-medium">اختر القارئ</span>
            </div>
            <Select
              value={reciterId}
              onValueChange={changeReciter}
              dir="rtl"
              aria-label="القارئ"
            >
              <SelectTrigger className="w-full rounded-xl border-white/10 bg-white/[0.03] text-teal-50 sm:w-64">
                <SelectValue placeholder="القارئ" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0a1c23] text-teal-50">
                {QURAN_RECITERS.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="focus:bg-teal-300/10">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* شبكة السور */}
          <div className="mt-6 flex flex-wrap gap-2">
            {QURAN_SURAHS.map((surah) => {
              const isActive = current?.surah === surah.n;
              return (
                <button
                  key={surah.n}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      // نفس السورة: تشغيل/إيقاف مؤقت/استئناف
                      togglePlay();
                      return;
                    }
                    startSurah(surah.n, reciterId);
                  }}
                  aria-label={`تشغيل سورة ${surah.name}`}
                  aria-pressed={isActive}
                  className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                    isActive
                      ? "border-teal-300/60 bg-teal-300/15 text-teal-100"
                      : "border-white/10 bg-white/[0.03] text-teal-100/70 hover:-translate-y-0.5 hover:border-teal-300/40 hover:bg-teal-300/10 hover:text-teal-100"
                  }`}
                >
                  {surah.name}
                  <span className="ms-1.5 text-[10px] text-teal-100/40">
                    {surah.ayahs} آية
                  </span>
                </button>
              );
            })}
          </div>

          {/* المشغّل */}
          {current && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-display truncate text-lg text-teal-50">
                    {activeTitle}
                  </span>
                  {playing && <Equalizer />}
                  {loading && (
                    <Loader2
                      className="size-4 shrink-0 animate-spin text-teal-300/70"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-xs tabular-nums text-teal-100/50">
                  {formatRecitationTime(position)} / {formatRecitationTime(duration)}
                </span>
              </div>

              {/* شريط التقدّم */}
              <div className="mt-4">
                <Slider
                  value={[Math.min(position, duration || 1)]}
                  max={duration > 0 ? duration : 1}
                  step={1}
                  disabled={duration <= 0}
                  onValueChange={([v]) => seek(v)}
                  aria-label="موضع التلاوة"
                  className="[&_[data-slot=slider-range]]:bg-teal-300"
                />
              </div>

              {/* أدوات التحكم */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* في RTL يظهر هذا الزر أولًا (يمين الشاشة) — السورة السابقة */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => skip(-1)}
                    aria-label="السورة السابقة"
                    className="size-10 rounded-full text-teal-100/70 hover:bg-white/5 hover:text-teal-100"
                  >
                    <SkipBack className="size-4 -scale-x-100" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={togglePlay}
                    aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
                    className="size-12 rounded-full bg-teal-300 text-teal-950 hover:bg-teal-200"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    ) : playing ? (
                      <Pause className="size-5" />
                    ) : (
                      <Play className="size-5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => skip(1)}
                    aria-label="السورة التالية"
                    className="size-10 rounded-full text-teal-100/70 hover:bg-white/5 hover:text-teal-100"
                  >
                    <SkipForward className="size-4 -scale-x-100" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setLoop((v) => !v)}
                    aria-pressed={loop}
                    aria-label={loop ? "التكرار مُفعّل" : "التكرار مُعطّل"}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                      loop
                        ? "border-teal-300/40 bg-teal-300/10 text-teal-200"
                        : "border-white/10 bg-transparent text-teal-100/50 hover:text-teal-100"
                    }`}
                  >
                    <Repeat className="size-3.5" aria-hidden="true" />
                    تكرار
                  </button>
                  <div className="flex items-center gap-2">
                    <Volume2
                      className="size-4 shrink-0 text-teal-100/50"
                      aria-hidden="true"
                    />
                    <Slider
                      value={[Math.round(volume * 100)]}
                      onValueChange={([v]) => {
                        setVolume(v / 100);
                      }}
                      max={100}
                      step={1}
                      className="w-20 sm:w-24"
                      aria-label="مستوى صوت التلاوة"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ملاحظة المصادر */}
          <p className="mt-4 text-xs leading-relaxed text-teal-100/40">
            تُبثّ التلاوات من مصادر مجانية مفتوحة عبر الإنترنت. ولإضافة قارئ
            خاصٍّ بك أو لتعمل بلا إنترنت: ضع ملفات MP3 في مجلد{" "}
            <code dir="ltr" className="rounded bg-white/5 px-1.5 py-0.5 text-teal-200/80">
              public/quran/{reciter.id}/{"رقم-السورة"}.mp3
            </code>{" "}
            وستُستخدم تلقائيًا قبل أي مصدر خارجي.
          </p>
        </div>
      </div>
    </section>
  );
}

export default QuranSection;
