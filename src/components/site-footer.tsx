"use client";

import { ExternalLink } from "lucide-react";

import { Logo } from "@/components/logo";

const LINKS = [
  { href: "#library", label: "المكتبة" },
  { href: "#stories", label: "قصص النوم" },
  { href: "#timer", label: "المؤقت" },
  { href: "#account", label: "سجلُّ الهدوء" },
];

const DHEFFAF_URL = "https://dheffaf.fqeeh.com/";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/5 bg-[#08161c]/50 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6">
        {/* الصف الرئيسية */}
        <div className="flex flex-col gap-6 pt-10 sm:flex-row sm:items-center sm:justify-between">
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
        </div>

        {/* توثيق البرمجة — من مشاريع شبكة ضفاف الإعلامية */}
        <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={DHEFFAF_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="شبكة ضفاف الإعلامية — الموقع الرسمي"
            className="group flex w-fit items-center gap-2.5 text-xs text-teal-100/55 transition-colors hover:text-teal-100"
          >
            <img
              src="/dheffaf.png"
              alt="شعار شبكة ضفاف الإعلامية"
              width={28}
              height={28}
              loading="lazy"
              className="size-7 shrink-0 rounded-lg bg-white/95 p-[3px] ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105"
            />
            <span>
              من مشاريع:{" "}
              <span className="text-teal-100/80 transition-colors group-hover:text-teal-50">
                شبكة ضفاف الإعلامية
              </span>
            </span>
            <ExternalLink
              className="size-3 opacity-40 transition-opacity group-hover:opacity-80"
              aria-hidden="true"
            />
          </a>

          <p className="text-xs text-teal-100/45">
            برمجة وتطوير : شبكة ضفاف الإعلامية
          </p>
        </div>
      </div>
    </footer>
  );
}
