"use client";

import { useEffect, useRef } from "react";
import { useSleep } from "@/components/sleep-provider";

/** مدة عبور القوس القمري للشاشة — ١٢ ساعة بغضّ النظر عن طول الجلسة */
const MOON_PERIOD_MS = 12 * 60 * 60 * 1000;

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  speed: number;
  phase: number;
  gold: boolean;
  glint: boolean;
}

interface ShootingStar {
  born: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** لوحة السماء: نجوم تتلألأ بلطف، ضباب بحري، وقمرٌ هلالي يعبر القوس ببطء */
export function NightSky() {
  const { dimFactor } = useSleep();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dimRef = useRef(dimFactor);

  useEffect(() => {
    dimRef.current = dimFactor;
  }, [dimFactor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let stars: Star[] = [];
    let moonSprite: HTMLCanvasElement | null = null;
    let shooting: ShootingStar | null = null;
    let nextShootingAt = performance.now() + 12000 + Math.random() * 18000;
    let raf = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const makeStars = () => {
      const count = Math.min(340, Math.max(110, Math.floor((width * height) / 8500)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.92,
        r: rand(0.4, 1.4),
        base: rand(0.25, 0.85),
        speed: rand(0.0004, 0.0016),
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() < 0.16,
        glint: Math.random() < 0.05,
      }));
    };

    const makeMoon = () => {
      const r = Math.max(26, Math.min(width, height) * 0.052);
      const size = Math.ceil(r * 4);
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const octx = off.getContext("2d");
      if (!octx) return null;
      const c = size / 2;
      const grad = octx.createRadialGradient(c - r * 0.3, c - r * 0.3, r * 0.2, c, c, r);
      grad.addColorStop(0, "#fdf6e3");
      grad.addColorStop(0.7, "#f2e3b3");
      grad.addColorStop(1, "#d9c28a");
      octx.fillStyle = grad;
      octx.beginPath();
      octx.arc(c, c, r, 0, Math.PI * 2);
      octx.fill();
      // عضّة الهلال — نحفر دائرة مزاحة بشفافية
      octx.globalCompositeOperation = "destination-out";
      octx.fillStyle = "#000";
      octx.beginPath();
      octx.arc(c - r * 0.52, c - r * 0.18, r * 0.94, 0, Math.PI * 2);
      octx.fill();
      return off;
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
      moonSprite = makeMoon();
    };
    resize();

    const drawMoonGlow = (x: number, y: number, r: number, t: number, dim: number) => {
      const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.00045);
      const glowR = r * (5.5 + pulse * 1.5);
      const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, glowR);
      g.addColorStop(0, `rgba(242, 227, 179, ${0.14 * dim})`);
      g.addColorStop(0.4, `rgba(214, 196, 140, ${0.05 * dim})`);
      g.addColorStop(1, "rgba(214, 196, 140, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - glowR, y - glowR, glowR * 2, glowR * 2);
    };

    const drawShooting = (now: number, dim: number) => {
      if (reduced) return;
      if (!shooting && now > nextShootingAt) {
        const startX = rand(width * 0.15, width * 0.85);
        const startY = rand(height * 0.05, height * 0.3);
        const angle = rand(0.5, 0.9) + (Math.random() < 0.5 ? Math.PI : 0);
        const speed = rand(0.45, 0.75);
        shooting = {
          born: now,
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed * 0.9,
          vy: Math.sin(angle) * speed * 0.55,
        };
        nextShootingAt = now + 18000 + Math.random() * 22000;
      }
      if (!shooting) return;
      const age = (now - shooting.born) / 1000;
      if (age > 1.1) {
        shooting = null;
        return;
      }
      const p = age / 1.1;
      const alpha = Math.sin(p * Math.PI) * 0.75 * dim;
      const x = shooting.x + shooting.vx * age * 900;
      const y = shooting.y + shooting.vy * age * 900;
      const tailX = shooting.vx * 90;
      const tailY = shooting.vy * 90;
      const grad = ctx.createLinearGradient(x - tailX, y - tailY, x, y);
      grad.addColorStop(0, "rgba(230, 245, 240, 0)");
      grad.addColorStop(1, `rgba(230, 245, 240, ${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - tailX, y - tailY);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const frame = (now: number) => {
      const dim = dimRef.current;
      ctx.clearRect(0, 0, width, height);

      // ضباب بحري ينجرّف ببطء
      if (!reduced) {
        for (let i = 0; i < 3; i++) {
          const t = now * 0.00002 * (0.6 + i * 0.35) + i * 2.1;
          const cx = width * (0.5 + 0.42 * Math.sin(t + i));
          const cy = height * (0.35 + 0.3 * Math.cos(t * 0.8 + i * 1.7));
          const rr = Math.max(width, height) * (0.32 + i * 0.08);
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
          g.addColorStop(0, `rgba(62, 138, 130, ${0.05 * dim})`);
          g.addColorStop(1, "rgba(62, 138, 130, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
        }
      }

      // النجوم — تومض بلطف وتخفت مع المؤقت
      for (const s of stars) {
        const tw = reduced ? 0.75 : 0.62 + 0.38 * Math.sin(now * s.speed + s.phase);
        const a = s.base * tw * dim;
        if (a < 0.02) continue;
        ctx.fillStyle = s.gold
          ? `rgba(236, 216, 160, ${a})`
          : `rgba(222, 238, 233, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.glint && a > 0.35) {
          ctx.strokeStyle = `rgba(222, 238, 233, ${a * 0.28})`;
          ctx.lineWidth = 0.7;
          const l = s.r * 4.2;
          ctx.beginPath();
          ctx.moveTo(s.x - l, s.y);
          ctx.lineTo(s.x + l, s.y);
          ctx.moveTo(s.x, s.y - l);
          ctx.lineTo(s.x, s.y + l);
          ctx.stroke();
        }
      }

      drawShooting(now, dim);

      // القوس القمري: يعبُر الشاشة خلال ١٢ ساعة تماماً
      const progress = (Date.now() % MOON_PERIOD_MS) / MOON_PERIOD_MS;
      const mx = width * (-0.07 + 1.14 * progress);
      const my = height * (0.8 - 0.62 * Math.sin(Math.PI * progress));
      const mr = Math.max(26, Math.min(width, height) * 0.052);
      drawMoonGlow(mx, my, mr, now, dim);
      if (moonSprite) {
        ctx.globalAlpha = 0.92 * Math.max(0.35, dim);
        ctx.drawImage(moonSprite, mx - mr * 2, my - mr * 2, mr * 4, mr * 4);
        ctx.globalAlpha = 1;
      }

      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-full w-full"
    />
  );
}
