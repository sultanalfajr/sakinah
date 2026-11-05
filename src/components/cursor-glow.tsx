"use client";

import { useEffect, useRef } from "react";
import { useSleep } from "@/components/sleep-provider";

/** يترك المؤشر ضوءاً خافتاً في الواجهة المظلمة — يشتدّ قليلاً في وضع الانغماس */
export function CursorGlow() {
  const { immersive } = useSleep();
  const glowRef = useRef<HTMLDivElement | null>(null);
  const immersiveRef = useRef(immersive);

  useEffect(() => {
    immersiveRef.current = immersive;
  }, [immersive]);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = glowRef.current;
    if (!el) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const tick = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      const scale = immersiveRef.current ? 1.45 : 1;
      el.style.transform = `translate3d(${x - 210}px, ${y - 210}px, 0) scale(${scale})`;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[3] h-[420px] w-[420px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-700 will-change-transform"
      style={{
        background:
          "radial-gradient(circle, rgba(94,234,212,0.11) 0%, rgba(94,234,212,0.045) 42%, transparent 68%)",
      }}
    />
  );
}
