"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { useSleep } from "@/components/sleep-provider";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#library", label: "المكتبة" },
  { href: "#stories", label: "قصص النوم" },
  { href: "#quran", label: "القرآن" },
  { href: "#hadith", label: "الأحاديث" },
  { href: "#timer", label: "المؤقت" },
  { href: "#account", label: "حسابي" },
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
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled
          ? "border-b border-white/5 bg-[#08161c]/70 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5" aria-label="سَكِينَة — الرئيسية">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-300/25 to-teal-600/10 ring-1 ring-teal-300/30">
            <Moon className="size-4.5 text-teal-200" />
          </span>
          <span className="font-display text-xl leading-none text-teal-50">
            سَكِينَة
            <span className="ms-2 hidden text-xs font-normal text-teal-100/50 sm:inline">
              أصواتٌ للنوم
            </span>
          </span>
        </a>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-7 md:flex">
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
    </header>
  );
}
