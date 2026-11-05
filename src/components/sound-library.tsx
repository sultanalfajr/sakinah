"use client";

import {
  CloudRain,
  Coffee,
  Flame,
  Piano,
  SlidersHorizontal,
  Trees,
  Waves,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CHANNEL_LABELS, MIXER_CHANNELS, type ChannelId } from "@/lib/audio/engine";
import { useSleep } from "@/components/sleep-provider";
import { Slider } from "@/components/ui/slider";

const SCENES: { id: ChannelId; icon: LucideIcon; name: string; desc: string }[] = [
  {
    id: "rain",
    icon: CloudRain,
    name: "المطر",
    desc: "شتاتمٌ مطريّ على النافذة، وإيقاعٌ يهدّئ الأفكار.",
  },
  {
    id: "forest",
    icon: Trees,
    name: "الغابة",
    desc: "هامسُ أوراقٍ، ونسيمٌ بين الأشجار، وصراصيرُ الليل.",
  },
  {
    id: "ocean",
    icon: Waves,
    name: "المحيط",
    desc: "أمواجٌ تتنفّس ببطء على شاطئٍ منسيّ.",
  },
  {
    id: "cafe",
    icon: Coffee,
    name: "المقهى",
    desc: "دندنةُ حديثٍ بعيدٍ ورنينُ فناجين في ساعةٍ وادعة.",
  },
  {
    id: "fire",
    icon: Flame,
    name: "المدفأة",
    desc: "طقطقةُ حطبٍ ودفءٌ يشبه الحضن.",
  },
  {
    id: "piano",
    icon: Piano,
    name: "همهمة البيانو",
    desc: "نغماتٌ متباعدة تسبح في صدىً بعيد.",
  },
];

const MIXER_ICONS: Record<ChannelId, LucideIcon> = {
  rain: CloudRain,
  wind: Wind,
  fire: Flame,
  forest: Trees,
  ocean: Waves,
  cafe: Coffee,
  piano: Piano,
};

/** شريط مساواة مصغّر ينبض أثناء التشغيل */
export function Equalizer({ className = "" }: { className?: string }) {
  return (
    <span className={`flex h-3 items-end gap-[2px] ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom animate-eq rounded-full bg-teal-300"
          style={{ height: "100%", animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export function SoundLibrary() {
  const { channels, toggleChannel, setChannel } = useSleep();

  return (
    <section id="library" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <span className="text-sm tracking-wide text-teal-300/80">المكتبة</span>
          <h2 className="font-display mt-2 text-3xl text-teal-50 sm:text-4xl">
            مشاهدٌ صوتية للنوم
          </h2>
          <p className="mt-3 leading-relaxed text-teal-100/60">
            ستّة عوالم تتكرّر بلا نهاية ولا بداية — اختر واحداً، أو ادمج
            عدة طبقاتٍ من الخلاط حتى تشبه ليلتك تماماً.
          </p>
        </div>

        {/* بطاقات المشاهد */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENES.map((scene) => {
            const value = channels[scene.id] ?? 0;
            const active = value > 0.001;
            const Icon = scene.icon;
            return (
              <button
                key={scene.id}
                onClick={() => toggleChannel(scene.id)}
                aria-pressed={active}
                aria-label={`${active ? "إيقاف" : "تشغيل"} ${scene.name}`}
                className={`group rounded-2xl border p-6 text-start backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${
                  active
                    ? "border-teal-300/40 bg-teal-300/10 ring-1 ring-teal-300/25"
                    : "border-white/10 bg-white/[0.04] hover:border-teal-300/25 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex size-11 items-center justify-center rounded-xl transition-colors ${
                      active ? "bg-teal-300/20 text-teal-200" : "bg-white/5 text-teal-200/80"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {active && <Equalizer />}
                </div>
                <h3 className="font-display mt-4 text-lg text-teal-50">{scene.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-teal-100/55">{scene.desc}</p>
                <span
                  className={`mt-4 block text-xs ${
                    active ? "text-teal-300" : "text-teal-100/40"
                  }`}
                >
                  {active ? `تعمل بشدّة ${Math.round(value * 100)}٪ — اضغط للإيقاف` : "اضغط للتشغيل"}
                </span>
              </button>
            );
          })}
        </div>

        {/* خلاط المشهد الصوتي */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-300/10 text-teal-200">
                <SlidersHorizontal className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-lg text-teal-50">خلاطُ المشهد الصوتي</h3>
                <p className="text-xs text-teal-100/50">
                  اسحب أشرطة الشدّة لطبقة المطر والرياح والنار — وفوق أيّ مشهدٍ يعمل.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-teal-300/15 bg-teal-300/5 px-3 py-1 text-xs text-teal-200/70">
              امزج كما تحبّ: مطرٌ فوق مدفأة، ورياحٌ فوق كلّ شيء
            </span>
          </div>

          <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {MIXER_CHANNELS.map((id) => {
              const Icon = MIXER_ICONS[id];
              const value = Math.round((channels[id] ?? 0) * 100);
              return (
                <div key={id} className="flex items-center gap-4">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      value > 0 ? "bg-teal-300/15 text-teal-200" : "bg-white/5 text-teal-100/40"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <label
                    htmlFor={`mixer-${id}`}
                    className="w-24 shrink-0 text-sm text-teal-100/70"
                  >
                    {CHANNEL_LABELS[id]}
                  </label>
                  <Slider
                    id={`mixer-${id}`}
                    value={[value]}
                    onValueChange={([v]) => setChannel(id, v / 100)}
                    max={100}
                    step={1}
                    aria-label={`شدّة ${CHANNEL_LABELS[id]}`}
                  />
                  <span className="w-10 text-end text-xs tabular-nums text-teal-100/50">
                    {value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
