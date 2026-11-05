"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ambience, CHANNEL_LABELS, type ChannelId } from "@/lib/audio/engine";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* ليالٍ مُعدّة مسبقاً — مشاهد صوتية مدتها ٤٥ دقيقة                     */
/* ------------------------------------------------------------------ */

export interface NightPreset {
  id: string;
  name: string;
  description: string;
  icon: "rain" | "ocean" | "fire";
  channels: Partial<Record<ChannelId, number>>;
}

export const NIGHT_PRESETS: NightPreset[] = [
  {
    id: "moonlit-rain",
    name: "مطرٌ على ضوء القمر",
    description: "مطرٌ وديع خلف النافذة وهبّاتُ رياحٍ خفيفة تمرّ من بعيد.",
    icon: "rain",
    channels: { rain: 0.8, wind: 0.25 },
  },
  {
    id: "midnight-shore",
    name: "شاطئُ منتصف الليل",
    description: "أمواجٌ تتنفّس ببطء على رملٍ باردٍ تحت سماءٍ مرصّعة.",
    icon: "ocean",
    channels: { ocean: 0.8, wind: 0.3 },
  },
  {
    id: "forest-cabin",
    name: "كابينةٌ في الغابة",
    description: "مدفأةٌ تُطقطق بحنانٍ ومطرٌ يهمس على سقفِ الخشب.",
    icon: "fire",
    channels: { fire: 0.75, rain: 0.3 },
  },
];

/* ------------------------------------------------------------------ */
/* السياق                                                              */
/* ------------------------------------------------------------------ */

interface TimerState {
  minutes: number;
  remaining: number;
  running: boolean;
}

interface SleepContextValue {
  channels: Partial<Record<ChannelId, number>>;
  activeScene: ChannelId | null;
  playing: boolean;
  paused: boolean;
  toggleChannel: (id: ChannelId) => void;
  setChannel: (id: ChannelId, v: number) => void;
  stopAll: () => void;
  togglePause: () => void;
  volume: number;
  setVolume: (v: number) => void;
  timer: TimerState;
  startTimer: (minutes: number) => void;
  startNight: (preset: NightPreset) => void;
  endSession: (log: boolean) => Promise<void>;
  immersive: boolean;
  toggleImmersive: () => void;
  dimFactor: number;
}

const SleepContext = createContext<SleepContextValue | null>(null);

const dispatchGain = (gain: number) => {
  window.dispatchEvent(new CustomEvent("sakinah:gain", { detail: { gain } }));
};

export function SleepProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Partial<Record<ChannelId, number>>>({});
  const [activeScene, setActiveScene] = useState<ChannelId | null>(null);
  const [paused, setPaused] = useState(false);
  const [volume, setVolumeState] = useState(0.9);
  const [timer, setTimer] = useState<TimerState>({ minutes: 0, remaining: 0, running: false });
  const [immersive, setImmersive] = useState(false);

  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const timerRef = useRef(timer);
  timerRef.current = timer;
  const fadingRef = useRef(false);

  /* ---------------- قنوات الصوت ---------------- */

  const applyChannel = useCallback((id: ChannelId, v: number) => {
    ambience.setChannel(id, v);
    setChannels((prev) => {
      const next = { ...prev };
      if (v <= 0.001) delete next[id];
      else next[id] = v;
      return next;
    });
    if (v > 0.001) {
      setActiveScene(id);
      setPaused(false);
    }
  }, []);

  const setChannel = useCallback(
    (id: ChannelId, v: number) => {
      applyChannel(id, v);
    },
    [applyChannel]
  );

  const toggleChannel = useCallback(
    (id: ChannelId) => {
      const current = channels[id] ?? 0;
      applyChannel(id, current > 0.001 ? 0 : 0.75);
    },
    [channels, applyChannel]
  );

  const stopAll = useCallback(() => {
    ambience.stopAll();
    setChannels({});
  }, []);

  const togglePause = useCallback(() => {
    if (ambience.paused) {
      ambience.resume();
      setPaused(false);
    } else {
      ambience.pause();
      setPaused(true);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    ambience.setVolume(clamped);
    const fade = timerRef.current.running && timerRef.current.remaining <= 60
      ? timerRef.current.remaining / 60
      : 1;
    dispatchGain(clamped * fade);
  }, []);

  /* ---------------- مؤقت النوم ---------------- */

  const logSession = useCallback(async (minutes: number, scene: string) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes, scene }),
      });
      if (!res.ok) throw new Error("failed");
      window.dispatchEvent(new CustomEvent("sakinah:profile-updated"));
      return true;
    } catch {
      return false;
    }
  }, []);

  const sceneLabel = useCallback(() => {
    const names = Object.entries(channels)
      .filter(([, v]) => (v ?? 0) > 0.001)
      .map(([id]) => CHANNEL_LABELS[id as ChannelId]);
    if (names.length === 0) return "جلسة هادئة";
    return names.slice(0, 3).join(" + ");
  }, [channels]);

  const finishSession = useCallback(
    async (loggedMinutes: number | null) => {
      ambience.stopAll();
      ambience.setFade(1);
      fadingRef.current = false;
      setChannels({});
      setTimer({ minutes: 0, remaining: 0, running: false });
      dispatchGain(volumeRef.current);
      if (loggedMinutes && loggedMinutes >= 1) {
        const ok = await logSession(loggedMinutes, sceneLabel());
        if (ok) {
          toast.success("أُنجزت جلستك — أحلامٌ هادئة", {
            description: `سُجّلت ${loggedMinutes} دقيقة من النوم`,
          });
        } else {
          toast.error("تعذّر تسجيل الجلسة، لكن الليلة ما زالت لك");
        }
      }
    },
    [logSession, sceneLabel]
  );

  const startTimer = useCallback(
    (minutes: number) => {
      fadingRef.current = false;
      ambience.setFade(1);
      setTimer({ minutes, remaining: minutes * 60, running: true });
    },
    []
  );

  const startNight = useCallback(
    (preset: NightPreset) => {
      ambience.ensure();
      // أوقف ما ليس في الوصفة
      for (const id of Object.keys(channels) as ChannelId[]) {
        if (!(id in preset.channels)) applyChannel(id, 0);
      }
      for (const [id, v] of Object.entries(preset.channels) as [ChannelId, number][]) {
        applyChannel(id, v);
      }
      startTimer(45);
      toast("بدأت ليلتك", { description: "٤٥ دقيقة — يتلاشى الصوت بلطفٍ في الدقيقة الأخيرة" });
    },
    [channels, applyChannel, startTimer]
  );

  const endSession = useCallback(
    async (log: boolean) => {
      const t = timerRef.current;
      if (t.running) {
        const elapsed = Math.max(0, t.minutes - Math.ceil(t.remaining / 60));
        await finishSession(log ? elapsed : null);
        if (log && elapsed < 5) {
          toast("جلسة قصيرة — لم تُسجّل هذه المرة", {
            description: "الجلسات من ٥ دقائق فأكثر تُكتب في سجلّك",
          });
        }
      } else {
        await finishSession(null);
      }
    },
    [finishSession]
  );

  // نبض المؤقت كل ثانية + تلاشي آخر ٦٠ ثانية
  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => {
      const t = timerRef.current;
      if (!t.running) return;
      const remaining = t.remaining - 1;

      if (remaining <= 60 && remaining > 0) {
        const fade = remaining / 60;
        ambience.setFade(fade);
        dispatchGain(volumeRef.current * fade);
        fadingRef.current = true;
      }

      if (remaining <= 0) {
        void finishSession(t.minutes);
        return;
      }
      setTimer((prev) => ({ ...prev, remaining }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.running, finishSession]);

  /* ---------------- الانغماس ---------------- */

  const toggleImmersive = useCallback(() => setImmersive((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && immersive) setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive]);

  /* ---------------- الاشتقاقات ---------------- */

  const playing = useMemo(
    () => Object.values(channels).some((v) => (v ?? 0) > 0.001),
    [channels]
  );

  const dimFactor = useMemo(() => {
    if (!timer.running) return 1;
    if (timer.remaining > 300) return 1;
    return 0.3 + 0.7 * (timer.remaining / 300);
  }, [timer]);

  const value = useMemo<SleepContextValue>(
    () => ({
      channels,
      activeScene,
      playing,
      paused,
      toggleChannel,
      setChannel,
      stopAll,
      togglePause,
      volume,
      setVolume,
      timer,
      startTimer,
      startNight,
      endSession,
      immersive,
      toggleImmersive,
      dimFactor,
    }),
    [
      channels,
      activeScene,
      playing,
      paused,
      toggleChannel,
      setChannel,
      stopAll,
      togglePause,
      volume,
      setVolume,
      timer,
      startTimer,
      startNight,
      endSession,
      immersive,
      toggleImmersive,
      dimFactor,
    ]
  );

  return <SleepContext.Provider value={value}>{children}</SleepContext.Provider>;
}

export function useSleep(): SleepContextValue {
  const ctx = useContext(SleepContext);
  if (!ctx) throw new Error("useSleep يجب أن يُستخدم داخل SleepProvider");
  return ctx;
}
