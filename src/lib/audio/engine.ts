/**
 * محرّك الأصوات المحيطة الإجرائي — سَكِينَة
 * يولّد كل المشاهد الصوتية رقمياً عبر Web Audio API:
 * ضوضاء ملوّنة + مرشحات + LFOs + مجدولات عشوائية لطيفة — بلا أي تسجيلات.
 */

export type ChannelId =
  | "rain"
  | "wind"
  | "fire"
  | "forest"
  | "ocean"
  | "cafe"
  | "piano";

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  rain: "المطر",
  wind: "الرياح",
  fire: "المدفأة",
  forest: "الغابة",
  ocean: "المحيط",
  cafe: "المقهى",
  piano: "همهمة البيانو",
};

/** ترتيب قنوات الخلاط في الواجهة */
export const MIXER_CHANNELS: ChannelId[] = [
  "rain",
  "wind",
  "fire",
  "forest",
  "ocean",
  "cafe",
  "piano",
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ------------------------------------------------------------------ */
/* ضوضاء ملوّنة مخزّنة                                                 */
/* ------------------------------------------------------------------ */

type NoiseType = "white" | "pink" | "brown";

const noiseCache = new WeakMap<AudioContext, Map<NoiseType, AudioBuffer>>();

function getNoise(ctx: AudioContext, type: NoiseType): AudioBuffer {
  let perCtx = noiseCache.get(ctx);
  if (!perCtx) {
    perCtx = new Map();
    noiseCache.set(ctx, perCtx);
  }
  const cached = perCtx.get(type);
  if (cached) return cached;

  const len = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    if (type === "white") {
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === "pink") {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.2;
      }
    }
  }
  perCtx.set(type, buffer);
  return buffer;
}

function loopNoise(ctx: AudioContext, type: NoiseType): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx, type);
  src.loop = true;
  return src;
}

/** LFO يتصل بمعامل صوتي */
function connectLfo(
  ctx: AudioContext,
  freq: number,
  depth: number,
  target: AudioParam,
  type: OscillatorType = "sine"
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = depth;
  osc.connect(g);
  g.connect(target);
  return osc;
}

/* ------------------------------------------------------------------ */
/* مجدول ذاتي بتأخير متغيّر                                            */
/* ------------------------------------------------------------------ */

class SelfLoop {
  private timer: number | null = null;
  private alive = false;

  constructor(
    private fn: () => void,
    private delayFn: () => number
  ) {}

  start(runFirst = false): void {
    if (this.alive) return;
    this.alive = true;
    const tick = () => {
      if (!this.alive) return;
      this.fn();
      this.timer = window.setTimeout(tick, Math.max(25, this.delayFn()));
    };
    if (runFirst) tick();
    else this.timer = window.setTimeout(tick, Math.max(25, this.delayFn()));
  }

  stop(): void {
    this.alive = false;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }
}

/* ------------------------------------------------------------------ */
/* قناة مشهد أساسية                                                    */
/* ------------------------------------------------------------------ */

interface ChannelHandle {
  fadeIn(intensity: number, ramp?: number): void;
  setIntensity(v: number, ramp?: number): void;
  dispose(): void;
}

abstract class SceneChannel implements ChannelHandle {
  protected ctx: AudioContext;
  protected out: GainNode;
  protected loops: SelfLoop[] = [];
  protected sources: AudioScheduledSourceNode[] = [];
  protected intensity = 0.75;
  protected revSend: AudioNode;
  private disposed = false;

  constructor(ctx: AudioContext, dest: AudioNode, revSend: AudioNode) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.0001;
    this.out.connect(dest);
    this.revSend = revSend;
  }

  /** ضوضاء حلزونية طويلة تُوقف تلقائياً عند التنظيف */
  protected noise(type: NoiseType): AudioBufferSourceNode {
    const src = loopNoise(this.ctx, type);
    this.sources.push(src);
    return src;
  }

  protected lfo(
    freq: number,
    depth: number,
    target: AudioParam,
    type: OscillatorType = "sine"
  ): OscillatorNode {
    const osc = connectLfo(this.ctx, freq, depth, target, type);
    this.sources.push(osc);
    return osc;
  }

  /** حلقة عشوائية تبدأ فوراً ضمن حلبة القناة */
  protected loop(fn: () => void, delayFn: () => number, runFirst = false): void {
    const l = new SelfLoop(fn, delayFn);
    l.start(runFirst);
    this.loops.push(l);
  }

  protected rampParam(p: AudioParam, v: number, ramp: number): void {
    p.setTargetAtTime(Math.max(0.0001, v), this.ctx.currentTime, ramp);
  }

  fadeIn(intensity: number, ramp = 2): void {
    this.build();
    this.apply(intensity, 0.2);
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(0.0001, t);
    this.out.gain.linearRampToValueAtTime(1, t + ramp);
  }

  setIntensity(v: number, ramp = 0.35): void {
    this.intensity = clamp01(v);
    this.apply(this.intensity, ramp);
  }

  dispose(ramp = 0.9): void {
    if (this.disposed) return;
    this.disposed = true;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(0.0001, this.out.gain.value), t);
    this.out.gain.linearRampToValueAtTime(0.0001, t + ramp);
    for (const l of this.loops) l.stop();
    window.setTimeout(
      () => {
        for (const s of this.sources) {
          try {
            s.stop();
          } catch {
            /* أُوقف مسبقاً */
          }
        }
        try {
          this.out.disconnect();
        } catch {
          /* غير متصل */
        }
      },
      ramp * 1000 + 150
    );
  }

  protected abstract build(): void;
  protected abstract apply(v: number, ramp: number): void;
}

/* ------------------------------------------------------------------ */
/* المشاهد الستّ + الرياح                                              */
/* ------------------------------------------------------------------ */

/** المطر: سرير مطري + خرير + قطرات متفرقة */
class RainChannel extends SceneChannel {
  private bedGain!: GainNode;
  private patGain!: GainNode;

  protected build(): void {
    const bed = this.noise("pink");
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 380;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    this.bedGain = this.ctx.createGain();
    this.bedGain.gain.value = 0.4;
    bed.connect(hp);
    hp.connect(lp);
    lp.connect(this.bedGain);
    this.bedGain.connect(this.out);
    bed.start();

    const pat = this.noise("white");
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3000;
    bp.Q.value = 0.7;
    this.patGain = this.ctx.createGain();
    this.patGain.gain.value = 0.12;
    pat.connect(bp);
    bp.connect(this.patGain);
    this.patGain.connect(this.out);
    pat.start();

    this.loop(
      () => this.spawnDroplet(),
      () => (1000 / (2.5 + this.intensity * 12)) * (0.4 + Math.random() * 1.2)
    );
  }

  private spawnDroplet(): void {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    const f = 900 + Math.random() * 2400;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.06);
    const g = this.ctx.createGain();
    const peak = (0.012 + Math.random() * 0.05) * (0.4 + this.intensity * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + Math.random() * 0.07);
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.random() * 1.6 - 0.8;
    o.connect(g);
    g.connect(p);
    p.connect(this.out);
    o.start(t);
    o.stop(t + 0.2);
  }

  protected apply(v: number, ramp: number): void {
    this.rampParam(this.bedGain.gain, 0.16 + 0.5 * v, ramp);
    this.rampParam(this.patGain.gain, 0.03 + 0.24 * v, ramp);
  }
}

/** الرياح: هدير بطيء + صفير عابر + هبّات */
class WindChannel extends SceneChannel {
  private bedGain!: GainNode;
  private whistleGain!: GainNode;

  protected build(): void {
    const bed = this.noise("brown");
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.6;
    this.bedGain = this.ctx.createGain();
    this.bedGain.gain.value = 0.4;
    bed.connect(lp);
    lp.connect(this.bedGain);
    this.bedGain.connect(this.out);
    bed.start();

    this.lfo(0.05, 230, lp.frequency);
    this.lfo(0.017, 130, lp.frequency);

    const whistle = this.noise("white");
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 950;
    bp.Q.value = 9;
    this.whistleGain = this.ctx.createGain();
    this.whistleGain.gain.value = 0.008;
    whistle.connect(bp);
    bp.connect(this.whistleGain);
    this.whistleGain.connect(this.out);
    whistle.start();

    this.lfo(0.06, 320, bp.frequency);

    this.loop(
      () => {
        const base = 0.22 + 0.5 * this.intensity;
        this.rampParam(this.bedGain.gain, base * (1.5 + Math.random() * 0.5), 1.1);
        window.setTimeout(
          () => this.rampParam(this.bedGain.gain, base, 1.5),
          2200 + Math.random() * 1200
        );
      },
      () => 5000 + Math.random() * 7000
    );
  }

  protected apply(v: number, ramp: number): void {
    this.rampParam(this.bedGain.gain, 0.22 + 0.5 * v, ramp);
    this.rampParam(this.whistleGain.gain, 0.004 + 0.016 * v, ramp);
  }
}

/** المدفأة: هدير دافئ + طقطقة عشوائية */
class FireChannel extends SceneChannel {
  private rumbleGain!: GainNode;

  protected build(): void {
    const rumble = this.noise("brown");
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 150;
    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.value = 0.5;
    rumble.connect(lp);
    lp.connect(this.rumbleGain);
    this.rumbleGain.connect(this.out);
    rumble.start();
    this.lfo(0.11, 0.06, this.rumbleGain.gain);

    this.loop(
      () => this.spawnCrackle(),
      () => (1000 / (2 + this.intensity * 12)) * (0.3 + Math.random() * 1.5)
    );
  }

  private spawnCrackle(): void {
    const t = this.ctx.currentTime;
    const pop = Math.random() < 0.12;
    const src = this.ctx.createBufferSource();
    src.buffer = getNoise(this.ctx, "white");
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = pop ? 350 + Math.random() * 550 : 1400 + Math.random() * 3400;
    bp.Q.value = 1 + Math.random() * 5;
    const dur = pop ? 0.12 + Math.random() * 0.16 : 0.02 + Math.random() * 0.1;
    const g = this.ctx.createGain();
    const peak = (0.02 + Math.random() * 0.09) * (0.5 + this.intensity * 0.7) * (pop ? 2.1 : 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.random() * 1.5 - 0.75;
    src.connect(bp);
    bp.connect(g);
    g.connect(p);
    p.connect(this.out);
    const offset = Math.random() * 3.8;
    src.start(t, offset, dur + 0.05);
  }

  protected apply(v: number, ramp: number): void {
    this.rampParam(this.rumbleGain.gain, 0.2 + 0.45 * v, ramp);
  }
}

/** الغابة: حفيف أوراق + نسيم + طيور بعيدة + صراصير الليل */
class ForestChannel extends SceneChannel {
  private leavesGain!: GainNode;
  private windGain!: GainNode;
  private cricketGain!: GainNode;

  protected build(): void {
    const leaves = this.noise("white");
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3200;
    this.leavesGain = this.ctx.createGain();
    this.leavesGain.gain.value = 0.08;
    leaves.connect(hp);
    hp.connect(this.leavesGain);
    this.leavesGain.connect(this.out);
    leaves.start();

    const wind = this.noise("brown");
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.15;
    wind.connect(lp);
    lp.connect(this.windGain);
    this.windGain.connect(this.out);
    wind.start();
    this.lfo(0.04, 90, lp.frequency);

    this.loop(
      () => {
        const target = (0.08 + 0.3 * this.intensity) * (0.6 + Math.random() * 0.9);
        this.rampParam(this.leavesGain.gain, target, 0.9);
        window.setTimeout(
          () => this.rampParam(this.leavesGain.gain, 0.04 + 0.12 * this.intensity, 1.3),
          1600 + Math.random() * 1200
        );
      },
      () => 3200 + Math.random() * 5200
    );

    this.loop(
      () => this.spawnBirdsong(),
      () => 7000 + Math.random() * 10000
    );

    // صراصير الليل — نبضان متقابلان في الاستريو
    for (const [freq, pan, mod] of [
      [4200, 0.5, 23],
      [4400, -0.5, 27],
    ] as const) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const am = this.ctx.createGain();
      am.gain.value = 0.5;
      const level = this.ctx.createGain();
      level.gain.value = 0.005;
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      osc.connect(am);
      am.connect(level);
      level.connect(p);
      p.connect(this.out);
      this.lfo(mod, 0.45, am.gain, "square");
      osc.start();
      this.sources.push(osc);
      if (!this.cricketGain) this.cricketGain = level;
    }
  }

  private spawnBirdsong(): void {
    const t0 = this.ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 3);
    const base = 2300 + Math.random() * 1700;
    for (let i = 0; i < notes; i++) {
      const t = t0 + i * (0.16 + Math.random() * 0.1);
      const o = this.ctx.createOscillator();
      o.type = "sine";
      const f = base * (0.92 + Math.random() * 0.16);
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.07);
      o.frequency.exponentialRampToValueAtTime(f * 1.1, t + 0.12);
      const g = this.ctx.createGain();
      const peak = (0.014 + Math.random() * 0.026) * (0.6 + this.intensity * 0.5);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.random() * 1.4 - 0.7;
      o.connect(g);
      g.connect(p);
      p.connect(this.out);
      o.start(t);
      o.stop(t + 0.16);
    }
  }

  protected apply(v: number, ramp: number): void {
    this.rampParam(this.leavesGain.gain, 0.04 + 0.12 * v, ramp);
    this.rampParam(this.windGain.gain, 0.1 + 0.18 * v, ramp);
    this.rampParam(this.cricketGain.gain, 0.002 + 0.007 * v, ramp);
  }
}

/** المحيط: تنفّس أمواج بطيء + رغوة + عمق بحري */
class OceanChannel extends SceneChannel {
  private depth!: GainNode;

  protected build(): void {
    this.depth = this.ctx.createGain();
    this.depth.gain.value = 0.8;
    this.depth.connect(this.out);

    const swell = this.noise("brown");
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const swellG = this.ctx.createGain();
    swellG.gain.value = 0.55;
    swell.connect(lp);
    lp.connect(swellG);
    swellG.connect(this.depth);
    swell.start();
    this.lfo(0.055, 0.3, swellG.gain);

    const mid = this.noise("brown");
    const lp2 = this.ctx.createBiquadFilter();
    lp2.type = "lowpass";
    lp2.frequency.value = 900;
    const midG = this.ctx.createGain();
    midG.gain.value = 0.18;
    mid.connect(lp2);
    lp2.connect(midG);
    midG.connect(this.depth);
    mid.start();
    this.lfo(0.041, 0.11, midG.gain);

    const foam = this.noise("white");
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1700;
    const foamG = this.ctx.createGain();
    foamG.gain.value = 0.045;
    foam.connect(hp);
    hp.connect(foamG);
    foamG.connect(this.depth);
    foam.start();
    this.lfo(0.049, 0.035, foamG.gain);

    const deep = this.ctx.createOscillator();
    deep.type = "sine";
    deep.frequency.value = 52;
    const deepG = this.ctx.createGain();
    deepG.gain.value = 0.012;
    deep.connect(deepG);
    deepG.connect(this.depth);
    deep.start();
    this.sources.push(deep);
    this.lfo(0.02, 0.006, deepG.gain);
  }

  protected apply(v: number, ramp: number): void {
    this.rampParam(this.depth.gain, 0.25 + 0.75 * v, ramp);
  }
}

/** المقهى: دندنة حديث بعيد + رنين فناجين + بخار الإسبريسو */
class CafeChannel extends SceneChannel {
  private mix!: GainNode;

  protected build(): void {
    this.mix = this.ctx.createGain();
    this.mix.gain.value = 0.8;
    this.mix.connect(this.out);

    const m1 = this.noise("brown");
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = "bandpass";
    bp1.frequency.value = 300;
    bp1.Q.value = 0.7;
    const g1 = this.ctx.createGain();
    g1.gain.value = 0.45;
    m1.connect(bp1);
    bp1.connect(g1);
    g1.connect(this.mix);
    m1.start();
    this.lfo(0.13, 0.12, g1.gain);

    const m2 = this.noise("brown");
    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.frequency.value = 620;
    bp2.Q.value = 0.5;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.2;
    m2.connect(bp2);
    bp2.connect(g2);
    g2.connect(this.mix);
    m2.start();
    this.lfo(0.083, 0.08, g2.gain);

    const room = this.noise("white");
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 800;
    const g3 = this.ctx.createGain();
    g3.gain.value = 0.03;
    room.connect(lp);
    lp.connect(g3);
    g3.connect(this.mix);
    room.start();

    this.loop(
      () => this.spawnClink(),
      () => 3500 + Math.random() * 5500
    );

    this.loop(
      () => {
        const hiss = this.ctx.createBufferSource();
        hiss.buffer = getNoise(this.ctx, "white");
        const hp = this.ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 5200;
        const hg = this.ctx.createGain();
        hg.gain.value = 0.0001;
        hiss.connect(hp);
        hp.connect(hg);
        hg.connect(this.mix);
        const t = this.ctx.currentTime;
        hg.gain.setTargetAtTime(0.006 + Math.random() * 0.006, t, 0.9);
        hg.gain.setTargetAtTime(0.0001, t + 1.4, 1.2);
        hiss.start(t, Math.random() * 3, 3.5);
      },
      () => 15000 + Math.random() * 16000
    );
  }

  private spawnClink(): void {
    const strike = (t: number) => {
      const o = this.ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = 1700 + Math.random() * 1200;
      const g = this.ctx.createGain();
      const peak = (0.012 + Math.random() * 0.028) * (0.6 + this.intensity * 0.5);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1 + Math.random() * 0.25);
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.random() * 1.2 - 0.6;
      o.connect(g);
      g.connect(p);
      p.connect(this.out);
      o.start(t);
      o.stop(t + 0.45);
    };
    const t = this.ctx.currentTime;
    strike(t);
    if (Math.random() < 0.3) strike(t + 0.09 + Math.random() * 0.08);
  }

  protected apply(v: number, ramp: number): void {
    this.rampParam(this.mix.gain, 0.3 + 0.7 * v, ramp);
  }
}

/** همهمة البيانو: وسادة نغمية + نوتات متباعدة تسبح في صدى بعيد */
class PianoChannel extends SceneChannel {
  private padGain!: GainNode;

  private static SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

  protected build(): void {
    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.03;
    const lpPad = this.ctx.createBiquadFilter();
    lpPad.type = "lowpass";
    lpPad.frequency.value = 620;
    this.padGain.connect(lpPad);
    lpPad.connect(this.out);

    for (const f of [110, 164.81]) {
      for (const det of [0, 5]) {
        const o = this.ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = det;
        const g = this.ctx.createGain();
        g.gain.value = 0.25;
        o.connect(g);
        g.connect(this.padGain);
        o.start();
        this.sources.push(o);
      }
    }
    this.lfo(0.07, 0.009, this.padGain.gain);

    this.loop(
      () => this.spawnNotes(),
      () => 2800 + Math.random() * 4800
    );
  }

  private spawnNotes(): void {
    const scale = PianoChannel.SCALE;
    const idx = Math.floor(Math.pow(Math.random(), 1.6) * scale.length);
    const notes = [scale[idx]];
    if (Math.random() < 0.28 && idx + 2 < scale.length) {
      notes.push(scale[idx + 1 + Math.floor(Math.random() * 2)]);
    }
    const t = this.ctx.currentTime;
    for (const f of notes) {
      const o1 = this.ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.value = f;
      const o2 = this.ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = f * 1.002;
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.35;
      const env = this.ctx.createGain();
      env.gain.value = 0.0001;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1500;
      const peak = (0.028 + Math.random() * 0.032) * (0.5 + this.intensity * 0.7);
      const attack = 0.5 + Math.random() * 0.8;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(peak, t + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t + attack + 4 + Math.random() * 3.5);
      o1.connect(env);
      o2.connect(g2);
      g2.connect(env);
      env.connect(lp);
      lp.connect(this.out);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.9;
      lp.connect(wet);
      wet.connect(this.revSend!);
      const stopAt = t + attack + 8.2;
      o1.start(t);
      o2.start(t);
      o1.stop(stopAt);
      o2.stop(stopAt);
    }
  }

  protected apply(v: number, ramp: number): void {
    this.rampParam(this.padGain.gain, 0.014 + 0.026 * v, ramp);
  }
}

type SceneFactory = new (
  ctx: AudioContext,
  dest: AudioNode,
  revSend: AudioNode
) => SceneChannel;

const BUILDERS: Record<ChannelId, SceneFactory> = {
  rain: RainChannel,
  wind: WindChannel,
  fire: FireChannel,
  forest: ForestChannel,
  ocean: OceanChannel,
  cafe: CafeChannel,
  piano: PianoChannel,
};

/* ------------------------------------------------------------------ */
/* المحرّك الرئيسي                                                     */
/* ------------------------------------------------------------------ */

export class AmbienceEngine {
  private ctx: AudioContext | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private master: GainNode | null = null;
  private revSend: GainNode | null = null;
  private channels = new Map<ChannelId, SceneChannel>();
  private volume = 0.9;
  private fade = 1;
  private userPaused = false;

  /** يُستدعى ضمن حدث نقرة المستخدم لتلبية سياسات التشغيل التلقائي */
  ensure(): AudioContext {
    if (typeof window === "undefined") throw new Error("المتصفح فقط");
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) throw new Error("Web Audio غير مدعوم في هذا المتصفح");
      const ctx = new AC();
      this.ctx = ctx;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 24;
      comp.ratio.value = 3;
      comp.attack.value = 0.02;
      comp.release.value = 0.35;

      const master = ctx.createGain();
      master.gain.value = this.volume * this.fade;
      comp.connect(master);
      master.connect(ctx.destination);

      // ناقل صدى موحّد للمقاطع الموسيقية
      const conv = ctx.createConvolver();
      conv.buffer = this.makeImpulse(ctx, 2.6, 2.4);
      const revSend = ctx.createGain();
      const revOut = ctx.createGain();
      revOut.gain.value = 0.42;
      revSend.connect(conv);
      conv.connect(revOut);
      revOut.connect(comp);

      this.comp = comp;
      this.master = master;
      this.revSend = revSend;
    }
    if (this.ctx.state === "suspended" && !this.userPaused) {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private makeImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  setChannel(id: ChannelId, intensity: number, ramp = 0.4): void {
    if (intensity <= 0.001) {
      const existing = this.channels.get(id);
      if (existing) {
        existing.dispose();
        this.channels.delete(id);
      }
      return;
    }
    const existing = this.channels.get(id);
    if (existing) {
      existing.setIntensity(intensity, ramp);
      return;
    }
    const ctx = this.ensure();
    const channel = new BUILDERS[id](ctx, this.comp!, this.revSend!);
    channel.fadeIn(intensity, 2);
    this.channels.set(id, channel);
  }

  setVolume(v: number): void {
    this.volume = clamp01(v);
    this.applyMaster();
  }

  /** عامِل التلاشي — يضبطه مؤقت النوم في آخر ٦٠ ثانية */
  setFade(f: number): void {
    this.fade = clamp01(f);
    this.applyMaster();
  }

  private applyMaster(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(
      Math.max(0.0001, this.volume * this.fade),
      this.ctx.currentTime,
      0.12
    );
  }

  pause(): void {
    if (this.ctx?.state === "running") {
      this.userPaused = true;
      void this.ctx.suspend();
    }
  }

  resume(): void {
    this.userPaused = false;
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  get paused(): boolean {
    return this.userPaused;
  }

  hasActive(): boolean {
    return this.channels.size > 0;
  }

  stopAll(ramp = 0.8): void {
    for (const [, handle] of this.channels) handle.dispose(ramp);
    this.channels.clear();
  }
}

/** نسخة وحيدة تُعاد استخدامها طوال حياة الصفحة */
export const ambience = new AmbienceEngine();
