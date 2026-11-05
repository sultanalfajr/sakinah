"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Smartphone, SquarePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "@/components/logo";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sakinah:pwa-dismissed";
const BAR_HEIGHT = "52px";

/** شريط تثبيت التطبيق — نافذة تثبيتٍ فورية على المتصفحات الداعمة، وإرشادٌ أنيق على iOS. */
export function PwaInstallBar() {
  const [visible, setVisible] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const iosModeRef = useRef(false);
  const promptRef = useRef<InstallPromptEvent | null>(null);

  /* تسجيل عامل الخدمة — في الإنتاج فقط حفاظًا على الحرارة في التطوير */
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const t = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  /* منطق الظهور والنافذة الفورية */
  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;

    try {
      if (window.localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* تجاهل */
    }

    const isIOS =
      /iphone|ipad|ipod/i.test(nav.userAgent) ||
      (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as InstallPromptEvent;
      iosModeRef.current = false;
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIOS) {
      iosModeRef.current = true;
      iosTimer = setTimeout(() => setVisible(true), 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  /* إزاحة الترويسة والواجهة بمقدار ارتفاع الشريط */
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.style.setProperty("--pwa-bar-h", BAR_HEIGHT);
    else root.style.removeProperty("--pwa-bar-h");
  }, [visible]);

  const install = async () => {
    const deferred = promptRef.current;
    if (!iosModeRef.current && deferred) {
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setVisible(false);
      } catch {
        /* تجاهل */
      }
      return;
    }
    setIosOpen(true);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* تجاهل */
    }
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-x-0 top-0 z-50 border-b border-teal-300/15 bg-[#07181e]/90 backdrop-blur-xl"
            role="region"
            aria-label="شريط تثبيت التطبيق"
          >
            <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <Logo className="size-7 shrink-0" />
                <p className="truncate text-[13px] text-teal-100/85">
                  ثبّت <span className="font-display text-teal-50">سَكِينَة</span>{" "}
                  كتطبيقٍ — بملء الشاشة، وبلا متصفح
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={install}
                  className="h-8 rounded-full bg-teal-300 px-3.5 text-[13px] font-bold text-[#062226] hover:bg-teal-200 sm:px-4"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  تثبيت التطبيق
                </Button>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="إخفاء شريط التثبيت"
                  className="rounded-full p-1.5 text-teal-100/50 transition hover:bg-white/5 hover:text-teal-100"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={iosOpen} onOpenChange={setIosOpen}>
        <SheetContent
          side="bottom"
          dir="rtl"
          className="border-teal-300/20 bg-[#081a20] text-teal-50"
        >
          <SheetHeader className="items-start text-start">
            <SheetTitle className="font-display text-lg text-teal-50">
              إضافة سَكِينَة إلى الشاشة الرئيسية
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed text-teal-100/60">
              نظام iPhone لا يتيح نافذة تثبيتٍ مباشرة — وهاتان الخطوتان هما الطريقة
              الرسمية الوحيدة:
            </SheetDescription>
          </SheetHeader>
          <ol className="mt-2 space-y-3 pb-6">
            <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-300/15 text-teal-200">
                <Share className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm text-teal-100/85">
                اضغط زرَّ <span className="font-bold text-teal-50">المشاركة</span> أسفل
                شريط Safari
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-300/15 text-teal-200">
                <SquarePlus className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm text-teal-100/85">
                اختر <span className="font-bold text-teal-50">«إضافة إلى الشاشة الرئيسية»</span>
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-teal-300/20 bg-teal-300/[0.06] p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-300/20 text-teal-100">
                <Smartphone className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm text-teal-100/85">
                افتح التطبيق من أيقونته — بملء الشاشة وبلا شريط عنوان
              </span>
            </li>
          </ol>
        </SheetContent>
      </Sheet>
    </>
  );
}
