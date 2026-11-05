"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Square, Timer as TimerIcon, Volume2 } from "lucide-react";
import { CHANNEL_LABELS, type ChannelId } from "@/lib/audio/engine";
import { useSleep } from "@/components/sleep-provider";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

export function MiniPlayer() {
  const { playing, paused, togglePause, channels, volume, setVolume, timer, endSession } =
    useSleep();

  const show = playing || timer.running;
  const activeNames =
    Object.entries(channels)
      .filter(([, v]) => (v ?? 0) > 0.001)
      .map(([id, v]) => `${CHANNEL_LABELS[id as ChannelId]} ${Math.round((v ?? 0) * 100)}٪`)
      .join(" + ") || "صمتٌ قبل النوم";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <div className="pointer-events-auto flex max-w-[94vw] items-center gap-2 rounded-full border border-white/10 bg-[#0a1d25]/85 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur-xl sm:gap-3 sm:px-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePause}
              aria-label={paused ? "استئناف الصوت" : "إيقاف مؤقت"}
              className="size-9 shrink-0 rounded-full bg-teal-300/15 text-teal-200 hover:bg-teal-300/25 hover:text-teal-100"
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </Button>

            <span className="hidden max-w-[13rem] min-w-0 truncate text-sm text-teal-100/75 sm:block">
              {activeNames}
            </span>

            <div className="flex items-center gap-2">
              <Volume2 className="size-4 shrink-0 text-teal-100/50" aria-hidden="true" />
              <Slider
                value={[Math.round(volume * 100)]}
                onValueChange={([v]) => setVolume(v / 100)}
                max={100}
                step={1}
                className="w-20 sm:w-28"
                aria-label="مستوى الصوت الرئيسي"
              />
            </div>

            {timer.running && (
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs tabular-nums ${
                  timer.remaining <= 60
                    ? "animate-pulse bg-amber-200/10 text-amber-200"
                    : "bg-white/5 text-teal-100/70"
                }`}
              >
                <TimerIcon className="size-3.5" aria-hidden="true" />
                {fmt(timer.remaining)}
              </span>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={() => void endSession(true)}
              aria-label="إنهاء الجلسة وتسجيل الدقائق"
              className="size-9 shrink-0 rounded-full text-teal-100/50 hover:bg-white/5 hover:text-teal-100"
            >
              <Square className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
