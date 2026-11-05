"use client";

import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon } from "lucide-react";
import { useSleep } from "@/components/sleep-provider";

/**
 * قشرة الانغماس: عند تفعيلها تختفي كلّ الواجهة (الهيدر والمحتوى والتذييل والمشغّل)
 * وتبقى السماء والصوت فقط — مع زر قمرٍ صغير للخروج ومفتاح Esc.
 */
export function ImmersiveShell({ children }: { children: ReactNode }) {
  const { immersive, toggleImmersive } = useSleep();

  return (
    <div className="relative z-10 flex min-h-svh flex-col">
      <div
        className={`flex min-h-svh flex-col transition-opacity duration-1000 ${
          immersive ? "pointer-events-none select-none opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>

      <AnimatePresence>
        {immersive && (
          <motion.button
            key="immersive-exit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            onClick={toggleImmersive}
            aria-label="الخروج من وضع الانغماس"
            title="الخروج من الانغماس"
            className="fixed bottom-4 start-4 z-50 rounded-full border border-white/10 bg-[#0a1d25]/70 p-3 text-teal-100/90 backdrop-blur-md"
          >
            <Moon className="size-5" aria-hidden="true" />
          </motion.button>
        )}
        {immersive && (
          <motion.p
            key="immersive-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4.5, times: [0, 0.18, 0.72, 1], ease: "easeInOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-6 z-50 px-4 text-center text-sm text-teal-100/50"
          >
            اضغط Esc أو أيقونة القمر للخروج — الليلُ كلّه لك الآن
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
