"use client";

import {
  ChevronDown,
  CloudRain,
  Flame,
  MoonStar,
  Play,
  Sparkles,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NIGHT_PRESETS, useSleep, type NightPreset } from "@/components/sleep-provider";
import { Button } from "@/components/ui/button";

const PRESET_ICONS: Record<NightPreset["icon"], LucideIcon> = {
  rain: CloudRain,
  ocean: Waves,
  fire: Flame,
};

export function Hero() {
  const { startNight, channels } = useSleep();

  const isActive = (preset: NightPreset) => {
    const presetEntries = Object.entries(preset.channels);
    if (Object.keys(channels).length !== presetEntries.length) return false;
    return presetEntries.every(
      ([id, v]) => Math.abs((channels[id as keyof typeof channels] ?? 0) - (v ?? 0)) < 0.06
    );
  };

  return (
    <section
      style={{ paddingTop: "calc(6rem + var(--pwa-bar-h, 0px))" }}
      className="relative flex min-h-[92svh] flex-col items-center justify-center px-4 pb-16 text-center sm:px-6"
    >
      <div className="flex items-center gap-2 rounded-full border border-teal-300/15 bg-teal-300/5 px-4 py-1.5 text-xs tracking-wide text-teal-200/80">
        <Sparkles className="size-3.5" aria-hidden="true" />
        تأملُ النوم والأصوات المحيطة
      </div>

      <h1 className="font-display mt-6 text-5xl leading-tight text-teal-50 sm:text-6xl md:text-7xl">
        دَعِ الليلَ يُحضِنُك
      </h1>

      <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-teal-100/60 sm:text-lg">
        مشاهدٌ صوتية تنجوِم ببطء، قصصٌ تُروى كهمسةٍ طويلة،
        ومؤقّتٌ يخفتُ شيئاً فشيئاً حتى الصمت.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          onClick={() => document.querySelector("#library")?.scrollIntoView({ behavior: "smooth" })}
          className="bg-teal-300 text-teal-950 hover:bg-teal-200"
        >
          <Play className="me-1.5 size-4" aria-hidden="true" />
          اختر مشهدك الصوتي
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => document.querySelector("#stories")?.scrollIntoView({ behavior: "smooth" })}
          className="border-white/10 bg-white/5 text-teal-50 hover:bg-white/10 hover:text-teal-50"
        >
          قصصُ النوم
        </Button>
      </div>

      {/* اختيار الليلة — مشاهد صوتية ٤٥ دقيقة */}
      <div className="mt-16 w-full max-w-4xl">
        <p className="mb-5 flex items-center justify-center gap-2 text-sm text-teal-100/50">
          <MoonStar className="size-4 text-amber-200/70" aria-hidden="true" />
          اختيارُ الليلة — مشهدٌ صوتيٌّ متكاملٌ مدتّه ٤٥ دقيقة
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {NIGHT_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.icon];
            const active = isActive(preset);
            return (
              <button
                key={preset.id}
                onClick={() => startNight(preset)}
                aria-label={`ابدأ ليلة ${preset.name} — ٤٥ دقيقة`}
                className={`group relative rounded-2xl border p-6 text-start backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${
                  active
                    ? "border-teal-300/40 bg-teal-300/10 ring-1 ring-teal-300/30"
                    : "border-white/10 bg-white/[0.04] hover:border-teal-300/25 hover:bg-white/[0.07]"
                }`}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-teal-300/20 text-teal-200" : "bg-white/5 text-teal-200/80"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-4 text-lg text-teal-50">{preset.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-teal-100/55">
                  {preset.description}
                </p>
                <span className="mt-4 flex items-center justify-between text-xs text-teal-100/45">
                  <span>٤٥ دقيقة • مؤقّتٌ تلقائي</span>
                  {active && (
                    <span className="flex items-center gap-1.5 text-teal-300">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-teal-300" />
                      </span>
                      تعمل الآن
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <a
        href="#library"
        aria-label="انزل إلى المكتبة"
        className="absolute bottom-7 text-teal-100/40 transition-colors hover:text-teal-100/80"
      >
        <ChevronDown className="size-6 animate-bob" aria-hidden="true" />
      </a>
    </section>
  );
}
