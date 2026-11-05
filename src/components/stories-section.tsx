"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen,
  Headphones,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

type StoryItem = {
  id: string;
  title: string;
  theme: string;
  content: string;
  minutes: number;
  isBuiltin: boolean;
  hasAudio: boolean;
  createdAt: string;
};

const SUGGESTIONS = [
  "قطارٌ ليليّ عبر الغيوم",
  "جزيرةٌ تنام في الضباب",
  "بيتُ الجدّ في الريف",
];

const GLASS_CARD =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md";

const CUSTOM_SCROLLBAR =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-300/20";

// نبضات معادل الصوت الصغير
const EQUALIZER_KEYFRAMES = `@keyframes sakinah-eq { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }`;

function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function previewText(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > 120 ? `${flat.slice(0, 120).trimEnd()}…` : flat;
}

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
            animation: `sakinah-eq 1.1s ease-in-out ${bar * 0.18}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

export default function StoriesSection() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [themeInput, setThemeInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [narratingId, setNarratingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [chunkCounts, setChunkCounts] = useState<Record<string, number>>({});
  const [openStory, setOpenStory] = useState<StoryItem | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const playTokenRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortChunkRef = useRef<(() => void) | null>(null);
  const gainRef = useRef(1);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await fetch("/api/stories");
      if (!res.ok) throw new Error("failed to load stories");
      const data = (await res.json()) as { stories?: StoryItem[] };
      setStories(data.stories ?? []);
    } catch {
      setLoadFailed(true);
      toast.error("تعذّر تحميل القصص، أعد المحاولة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStories();
  }, [fetchStories]);

  // مستوى الصوت العام: يستمع لحدث الموقّت (sakinah:gain) ليخفي الرواية تدريجيًا
  useEffect(() => {
    const handler = (event: Event) => {
      const gain = (event as CustomEvent<{ gain?: number }>).detail?.gain;
      gainRef.current =
        typeof gain === "number" && Number.isFinite(gain)
          ? Math.min(1, Math.max(0, gain))
          : 1;
      const audio = audioRef.current;
      if (audio) audio.volume = 0.9 * gainRef.current;
    };
    window.addEventListener("sakinah:gain", handler);
    return () => window.removeEventListener("sakinah:gain", handler);
  }, []);

  const stopPlayback = useCallback(() => {
    playTokenRef.current += 1;
    abortChunkRef.current?.();
    abortChunkRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  // يشغّل مقطعًا واحدًا ويعود true عند انتهائه الطبيعي
  const playChunk = useCallback(
    (id: string, index: number) =>
      new Promise<boolean>((resolve) => {
        const audio = new Audio(`/api/stories/${id}/audio?i=${index}`);
        audioRef.current = audio;
        audio.volume = 0.9 * gainRef.current;
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          abortChunkRef.current = null;
          audio.removeEventListener("ended", onEnded);
          audio.removeEventListener("error", onError);
          resolve(ok);
        };
        const onEnded = () => finish(true);
        const onError = () => finish(false);
        abortChunkRef.current = () => finish(false);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);
        audio.play().catch(() => finish(false));
      }),
    []
  );

  const runPlayback = useCallback(
    async (id: string, total?: number) => {
      const token = ++playTokenRef.current;
      setPlayingId(id);
      const limit = total ?? 201;
      for (let k = 0; k < limit; k++) {
        if (playTokenRef.current !== token) return;
        const ok = await playChunk(id, k);
        if (!ok) {
          if (playTokenRef.current === token) {
            audioRef.current = null;
            setPlayingId(null);
          }
          return;
        }
        if (playTokenRef.current !== token) return;
      }
      if (playTokenRef.current !== token) return;
      audioRef.current = null;
      setPlayingId(null);
    },
    [playChunk]
  );

  const handleListen = useCallback(
    async (story: StoryItem) => {
      if (playingId === story.id) {
        stopPlayback();
        return;
      }
      stopPlayback();

      let total = chunkCounts[story.id];
      if (!story.hasAudio) {
        let narrateError = "تعذّر تجهيز الرواية الصوتية، أعد المحاولة";
        setNarratingId(story.id);
        try {
          const res = await fetch(`/api/stories/${story.id}/narrate`, {
            method: "POST",
          });
          if (!res.ok) {
            const errData = (await res.json().catch(() => null)) as { error?: string } | null;
            if (errData?.error) narrateError = errData.error;
            throw new Error("narration failed");
          }
          const data = (await res.json()) as { chunkCount: number };
          total = data.chunkCount;
          setChunkCounts((prev) => ({ ...prev, [story.id]: data.chunkCount }));
          setStories((prev) =>
            prev.map((item) =>
              item.id === story.id ? { ...item, hasAudio: true } : item
            )
          );
          toast.success("الرواية جاهزة، أغمد عينيك");
        } catch {
          toast.error(narrateError);
          return;
        } finally {
          setNarratingId(null);
        }
      }

      void runPlayback(story.id, total);
    },
    [chunkCounts, playingId, runPlayback, stopPlayback]
  );

  const handleGenerate = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (generating) return;
      setGenerating(true);
      try {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: themeInput.trim() }),
        });
        if (!res.ok) {
          const errData = (await res.json().catch(() => null)) as { error?: string } | null;
          toast.error(errData?.error ?? "تعذّر نسج القصة، أعد المحاولة");
          return;
        }
        const story = (await res.json()) as StoryItem;
        setStories((prev) => [story, ...prev]);
        setThemeInput("");
        toast.success("خُيطت القصة، هيا لنسمعها");
      } catch {
        toast.error("تعذّر نسج القصة، أعد المحاولة");
      } finally {
        setGenerating(false);
      }
    },
    [generating, themeInput]
  );

  // التمرير التلقائي: بكسل واحد كل 50ms حتى نهاية النص
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    const timer = window.setInterval(() => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        setAutoScroll(false);
        return;
      }
      el.scrollTop += 1;
    }, 50);
    return () => window.clearInterval(timer);
  }, [autoScroll, openStory?.id]);

  return (
    <section id="stories" className="relative py-20 sm:py-28">
      <style>{EQUALIZER_KEYFRAMES}</style>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* الترويسة */}
        <span className="text-sm tracking-wide text-teal-300/80">قصص النوم</span>
        <h2 className="font-display mt-2 text-3xl text-teal-50 sm:text-4xl">
          حكاياتٌ تُروى ببطء
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-teal-100/60">
          قصصٌ طويلة بلا حبكةٍ متوترة — صوتٌ هادئ يرافقك خطوةً خطوة حتى تغمض
          عيناك.
        </p>

        {/* صندوق التوليد */}
        <div className={`${GLASS_CARD} mt-10`}>
          <div className="flex items-center gap-2 text-teal-300">
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="text-sm font-medium">دوّن لي قصة جديدة</span>
          </div>
          <form
            onSubmit={handleGenerate}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Input
              dir="rtl"
              value={themeInput}
              onChange={(event) => setThemeInput(event.target.value)}
              maxLength={60}
              placeholder="مثال: قطارٌ يمرّ فوق الغيوم…"
              aria-label="موضوع القصة"
              className="h-11 flex-1 rounded-xl border-white/10 bg-white/[0.03] text-teal-50 placeholder:text-teal-100/40 focus-visible:border-teal-300/40 focus-visible:ring-teal-300/20"
            />
            <Button
              type="submit"
              disabled={generating}
              aria-label="نسج القصة"
              className="h-11 rounded-xl bg-teal-300 whitespace-nowrap text-teal-950 hover:bg-teal-200"
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ننسج القصة…
                </>
              ) : (
                "نسج القصة"
              )}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setThemeInput(suggestion)}
                aria-label={`اقتراح: ${suggestion}`}
                className="rounded-full border border-teal-300/20 bg-teal-300/5 px-3 py-1 text-xs text-teal-200/90 transition hover:bg-teal-300/10 hover:text-teal-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* شبكة القصص */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {loading &&
            [0, 1, 2, 3].map((index) => (
              <div key={index} className={GLASS_CARD}>
                <div className="flex items-center gap-4">
                  <Skeleton className="size-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="mt-6 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-5/6" />
                <Skeleton className="mt-6 h-9 w-40 rounded-xl" />
              </div>
            ))}

          {!loading && loadFailed && (
            <div className={`${GLASS_CARD} md:col-span-2 text-center`}>
              <p className="text-teal-100/70">تعذّر تحميل القصص.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void fetchStories()}
                aria-label="إعادة المحاولة"
                className="mt-4 rounded-xl border-teal-300/30 text-teal-200 hover:bg-teal-300/10 hover:text-teal-100"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                إعادة المحاولة
              </Button>
            </div>
          )}

          {!loading && !loadFailed && stories.length === 0 && (
            <div className={`${GLASS_CARD} md:col-span-2 text-center`}>
              <p className="text-teal-100/70">
                لا توجد قصص بعد — دوّن لي قصتك الأولى.
              </p>
            </div>
          )}

          {!loading &&
            stories.map((story, index) => {
              const isPlaying = playingId === story.id;
              const isNarrating = narratingId === story.id;
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(index, 4) * 0.08,
                    ease: "easeOut",
                  }}
                  className={`${GLASS_CARD} flex flex-col gap-4`}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-teal-300/20 bg-teal-300/10 text-teal-300">
                      <BookOpen className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display truncate text-xl text-teal-50">
                          {story.title}
                        </h3>
                        {isPlaying && <Equalizer />}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full border-teal-300/30 bg-teal-300/5 text-xs text-teal-200"
                        >
                          {story.theme}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-teal-100/60">
                    <span>~{story.minutes} دقيقة</span>
                    <span aria-hidden="true">·</span>
                    <span>({wordCount(story.content)} كلمة)</span>
                    {story.isBuiltin && (
                      <span className="rounded-full bg-teal-300/10 px-2 py-0.5 text-[10px] text-teal-200/80">
                        مضمّنة
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-teal-100/60">
                    {previewText(story.content)}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      aria-label={`اقرأ: ${story.title}`}
                      onClick={() => {
                        setAutoScroll(false);
                        setOpenStory(story);
                      }}
                      className="rounded-xl border-white/15 bg-transparent text-teal-100 hover:bg-white/[0.06] hover:text-teal-50"
                    >
                      اقرأ
                    </Button>

                    {isPlaying ? (
                      <Button
                        type="button"
                        aria-label={`إيقاف: ${story.title}`}
                        onClick={() => stopPlayback()}
                        className="rounded-xl border border-teal-300/40 bg-teal-300/10 text-teal-200 hover:bg-teal-300/20 hover:text-teal-100"
                      >
                        <Square className="size-4" aria-hidden="true" />
                        إيقاف
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={isNarrating}
                        aria-label={`استمع: ${story.title}`}
                        onClick={() => void handleListen(story)}
                        className="rounded-xl bg-teal-300 text-teal-950 hover:bg-teal-200"
                      >
                        {isNarrating ? (
                          <>
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                            نجهّز الرواية الصوتية…
                          </>
                        ) : (
                          <>
                            <Headphones
                              className="size-4"
                              aria-hidden="true"
                            />
                            استمع
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {isNarrating && (
                    <p className="text-xs text-teal-100/50">
                      قد يستغرق تجهيز الرواية حتى دقيقة…
                    </p>
                  )}
                </motion.div>
              );
            })}
        </div>
      </div>

      {/* حوار القراءة */}
      <Dialog
        open={!!openStory}
        onOpenChange={(open) => {
          if (!open) {
            setAutoScroll(false);
            setOpenStory(null);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-w-2xl gap-4 rounded-2xl border-white/10 bg-[#0a1c23] p-6 text-teal-50 sm:max-w-2xl"
        >
          {openStory && (
            <>
              <DialogHeader className="text-start sm:text-start">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DialogTitle className="font-display text-2xl leading-snug text-teal-50">
                      {openStory.title}
                    </DialogTitle>
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-teal-300/30 bg-teal-300/5 text-xs text-teal-200"
                      >
                        {openStory.theme}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pt-1">
                    <label
                      htmlFor="stories-auto-scroll"
                      className="cursor-pointer text-xs text-teal-100/60"
                    >
                      تمرير تلقائي
                    </label>
                    <Switch
                      id="stories-auto-scroll"
                      checked={autoScroll}
                      onCheckedChange={setAutoScroll}
                      aria-label="تمرير تلقائي"
                      className="data-[state=checked]:bg-teal-300 data-[state=unchecked]:bg-white/15"
                    />
                  </div>
                </div>
              </DialogHeader>
              <div
                key={openStory.id}
                ref={scrollRef}
                className={`${CUSTOM_SCROLLBAR} max-h-[65vh] overflow-y-auto pe-2 text-lg leading-loose text-teal-50/90`}
              >
                {openStory.content
                  .split("\n")
                  .map((paragraph, index) =>
                    paragraph.trim() ? (
                      <p key={index} className="mb-5 last:mb-0">
                        {paragraph}
                      </p>
                    ) : null
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
