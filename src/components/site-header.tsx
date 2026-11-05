"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { useSleep } from "@/components/sleep-provider";
import { Logo } from "@/components/logo";
import { PwaInstallBar } from "@/components/pwa-install-bar";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#library", label: "المكتبة" },
  { href: "#stories", label: "قصص النوم" },
  { href: "#quran", label: "القرآن الكريم" },
  { href: "#hadith", label: "الأحاديث النبوية" },
  { href: "#timer", label: "المؤقت" },
  { href: "#account", label: "سجلُّ الهدوء" },
];

export function SiteHeader() {
  const { toggleImmersive } = useSleep();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{ top: "var(--pwa-bar-h, 0px)" }}
      className={`fixed inset-x-0 z-40 transition-colors duration-500 ${
        scrolled
          ? "border-b border-white/5 bg-[#08161c]/70 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5" aria-label="سَكِينَة — الرئيسية">
          <Logo className="size-9 drop-shadow-[0_0_14px_rgba(45,212,191,0.35)]" />
          <span className="font-display text-xl leading-none text-teal-50">
            سَكِينَة
          </span>
        </a>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-5 lg:gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-teal-100/60 transition-colors hover:text-teal-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleImmersive}
          aria-label="وضع الانغماس — إخفاء كل الواجهة"
          title="انغماسٌ كامل"
          className="text-teal-100/70 hover:bg-teal-300/10 hover:text-teal-100"
        >
          <Moon className="size-5" />
        </Button>
      </div>
      <PwaInstallBar />
    </header>
  );
}
