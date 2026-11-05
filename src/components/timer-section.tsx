"use client";

import { MoonStar, Timer as TimerIcon } from "lucide-react";
import { useSleep } from "@/components/sleep-provider";
import { Button } from "@/components/ui/button";

const PRESET_MINUTES = [30, 60, 90] as const;

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

export function TimerSection() {
  const { timer, startTimer, endSession, playing, setChannel } = useSleep();

  const begin = (minutes: number) => {
    if (!playing) {
      setChannel("rain", 0.65);
    }
    startTimer(minutes);
  };

  const total = timer.minutes * 60;
  const fraction = total > 0 ? timer.remaining / total : 0;
  const circumference = 2 * Math.PI * 72;
  const fading = timer.running && timer.remaining <= 60;

  return (
    <section id="timer" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <span className="text-sm tracking-wide text-teal-300/80">مؤقّت النوم</span>
          <h2 className="font-display mt-2 text-3xl text-teal-50 sm:text-4xl">
            نم بلا قلق — سنخفّت الصوت عنك
          </h2>
          <p className="mt-3 leading-relaxed text-teal-100/60">
            اختر مدّة جلستك؛ في الدقيقة الأخيرة يتلاشى الصوتُ ببطءٍ طويل
            حتى الصمت، وتخفتُ النجوم معه.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          {!timer.running ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md">
              <div className="flex items-center justify-center gap-3">
                {PRESET_MINUTES.map((m) => (
                  <button
                    key={m}
                    onClick={() => begin(m)}
                    aria-label={`ابدأ مؤقت ${m} دقيقة`}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-teal-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300/40 hover:bg-teal-300/10"
                  >
                    <span className="font-display text-2xl tabular-nums">{m}</span>
                    <span className="text-xs text-teal-100/50">دقيقة</span>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-center text-sm leading-relaxed text-teal-100/50">
                إن لم يكن هناك صوتٌ يعمل، سنضع المطر الوديع رفيقاً لك.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md">
              <div className="relative mx-auto h-[190px] w-[190px]">
                <svg
                  width="190"
                  height="190"
                  viewBox="0 0 190 190"
                  className="-rotate-90"
                  aria-hidden="true"
                >
                  <circle
                    cx="95"
                    cy="95"
                    r="72"
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="95"
                    cy="95"
                    r="72"
                    stroke="url(#timer-grad)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - fraction)}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                  <defs>
                    <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5eead4" />
                      <stop offset="100%" stopColor="#e8d5a3" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-4xl tabular-nums text-teal-50">
                    {fmt(timer.remaining)}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-teal-100/50">
                    <TimerIcon className="size-3.5" aria-hidden="true" />
                    من {timer.minutes} دقيقة
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center" aria-live="polite">
                {fading ? (
                  <p className="animate-pulse text-sm text-amber-200/90">
                    يتلاشى الصوتُ الآن ببطء… أغمض عينيك
                  </p>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-sm text-teal-100/55">
                    <MoonStar className="size-4 text-amber-200/60" aria-hidden="true" />
                    تعمل أصواتُك — النجومُ ستخفتُ في آخر خمس دقائق
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <Button
                  onClick={() => void endSession(true)}
                  className="bg-teal-300 text-teal-950 hover:bg-teal-200"
                >
                  إنهاء وتسجيل الدقائق
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void endSession(false)}
                  className="text-teal-100/60 hover:bg-white/5 hover:text-teal-100"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
