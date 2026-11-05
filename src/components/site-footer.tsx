"use client";

import { Logo } from "@/components/logo";

const LINKS = [
  { href: "#library", label: "المكتبة" },
  { href: "#stories", label: "قصص النوم" },
  { href: "#timer", label: "المؤقت" },
  { href: "#account", label: "حسابي" },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/5 bg-[#08161c]/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <span className="flex items-center gap-2">
            <Logo className="size-9" />
            <span className="font-display text-lg text-teal-50">سَكِينَة</span>
          </span>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-teal-100/50">
            كلُّ الأصواتِ مُولّدةٌ رقمياً داخل متصفحك — بلا تسجيلاتٍ، بلا إعلانات،
            بلا شيء يوقظك.
          </p>
        </div>

        <nav aria-label="روابط التذييل" className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-teal-100/55 transition-colors hover:text-teal-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-teal-100/35">صُنعت بهدوءٍ — سَكِينَة</p>
      </div>
    </footer>
  );
}
