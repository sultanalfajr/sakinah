"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  Hourglass,
  MoonStar,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DayStat = { date: string; label: string; minutes: number };

type SessionRow = {
  id: string;
  scene: string;
  minutes: number;
  createdAt: string;
};

type ProfileStats = {
  streak: number;
  longestStreak: number;
  totalMinutes: number;
  nightsCount: number;
  lastSessionDate: string | null;
};

type ProfileResponse = {
  profile: ProfileStats;
  week: DayStat[];
  recentSessions: SessionRow[];
};

const GLASS_CARD =
  "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md";
const PROFILE_UPDATED_EVENT = "sakinah:profile-updated";

/** وقت نسبيّ بالعربية: دقائق ← ساعات ← أيام. */
function formatRelativeTime(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  const diffDays = Math.floor(diffHours / 24);
  return rtf.format(-diffDays, "day");
}

/** نصّ تحفيزي يتغيّر بعدد الليالي الهادئة. */
function nightsCopy(nights: number): string {
  if (nights <= 0) return "ليلتك الأولى تنتظرك";
  if (nights < 7) return "البذرة تنمو";
  return "هدوءٌ يتراكم";
}

type StatCardProps = {
  label: string;
  value: number;
  unit: string;
  sub: string;
  icon: LucideIcon;
  iconTileClass: string;
  valueClass: string;
  delay: number;
};

function StatCard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  iconTileClass,
  valueClass,
  delay,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(GLASS_CARD, "p-6")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-teal-100/60">{label}</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span
              className={cn(
                "font-display text-4xl leading-none tabular-nums",
                valueClass
              )}
            >
              {value}
            </span>
            <span className="text-sm text-teal-100/60">{unit}</span>
          </p>
          <p className="mt-3 text-xs text-teal-100/60">{sub}</p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconTileClass
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className={cn(GLASS_CARD, "p-6")}>
      <div className="flex items-start justify-between gap-3">
        <div className="w-full space-y-3">
          <Skeleton className="h-4 w-20 bg-white/10" />
          <Skeleton className="h-9 w-16 bg-white/10" />
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>
        <Skeleton className="size-10 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function AccountSection() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const payload = (await response.json()) as ProfileResponse;
      setData(payload);
    } catch {
      toast.error("تعذّر تحميل إحصاءاتك");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // التحميل الأول
  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // يعاد الجلب عندما يُسجَّل وضع جديد في أيّ جزء آخر من التطبيق
  useEffect(() => {
    window.addEventListener(PROFILE_UPDATED_EVENT, loadProfile);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, loadProfile);
  }, [loadProfile]);

  const profile = data?.profile ?? null;
  const week = data?.week ?? [];
  const recentSessions = data?.recentSessions ?? [];
  const todayKey = week.length > 0 ? week[week.length - 1].date : "";
  const maxMinutes =
    week.length > 0 ? Math.max(...week.map((day) => day.minutes)) : 0;
  const heightPercent = (minutes: number) =>
    Math.max(4, (minutes / Math.max(60, maxMinutes)) * 100);

  return (
    <section
      id="account"
      aria-labelledby="account-heading"
      className="relative py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm tracking-wide text-teal-300/80">
            رحلتك نحو النوم
          </span>
          <h2
            id="account-heading"
            className="mt-2 font-display text-3xl text-teal-50 sm:text-4xl"
          >
            خطُّ النوم ودقائقه
          </h2>
          <p className="mt-3 leading-relaxed text-teal-100/60">
            كل ليلةٍ تنام فيها بهدوءٍ، تُكتوب هنا — دقيقةً دقيقة.
          </p>
        </div>

        <div className="mt-10 space-y-4 sm:mt-12 sm:space-y-6">
          {isLoading ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
              <div className={cn(GLASS_CARD, "p-6")}>
                <Skeleton className="h-4 w-36 bg-white/10" />
                <Skeleton className="mt-6 h-28 w-full bg-white/10" />
              </div>
              <div className={cn(GLASS_CARD, "p-6")}>
                <Skeleton className="h-4 w-28 bg-white/10" />
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-12 w-full bg-white/10" />
                  <Skeleton className="h-12 w-full bg-white/10" />
                  <Skeleton className="h-12 w-full bg-white/10" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="السلسلة الحالية"
                  value={profile?.streak ?? 0}
                  unit="ليلة"
                  sub={`أطول سلسلة: ${profile?.longestStreak ?? 0} ليلة`}
                  icon={MoonStar}
                  iconTileClass="bg-amber-200/10 text-amber-200"
                  valueClass="text-amber-200"
                  delay={0}
                />
                <StatCard
                  label="دقائق النوم"
                  value={profile?.totalMinutes ?? 0}
                  unit="دقيقة"
                  sub={`≈ ${Math.round((profile?.totalMinutes ?? 0) / 60)} ساعة من الهدوء`}
                  icon={Hourglass}
                  iconTileClass="bg-teal-300/10 text-teal-300"
                  valueClass="text-teal-200"
                  delay={0.08}
                />
                <StatCard
                  label="الليالي الهادئة"
                  value={profile?.nightsCount ?? 0}
                  unit="ليلة"
                  sub={nightsCopy(profile?.nightsCount ?? 0)}
                  icon={Sparkles}
                  iconTileClass="bg-teal-300/10 text-teal-300"
                  valueClass="text-teal-200"
                  delay={0.16}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  className={cn(GLASS_CARD, "p-6 lg:col-span-3")}
                >
                  <p className="text-sm text-teal-100/60">
                    لياليك السبع الأخيرة
                  </p>
                  <div
                    aria-label="مخطط دقائق النوم خلال سبع ليالٍ"
                    className="mt-6 flex items-end gap-2"
                  >
                    {week.map((day, index) => {
                      const isToday = day.date === todayKey;
                      const isZero = day.minutes <= 0;
                      return (
                        <div
                          key={day.date}
                          className="flex min-w-0 flex-1 flex-col items-center gap-2"
                        >
                          <div className="flex h-28 w-full items-end">
                            <motion.div
                              role="img"
                              aria-label={`${day.label}: ${day.minutes} دقيقة`}
                              title={`${day.minutes} دقيقة — ${day.date}`}
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{
                                duration: 0.6,
                                delay: index * 0.05,
                                ease: "easeOut",
                              }}
                              style={{ height: `${heightPercent(day.minutes)}%` }}
                              className={cn(
                                "w-full origin-bottom rounded-t-md",
                                isZero
                                  ? "border border-dashed border-white/10 bg-white/5"
                                  : isToday
                                    ? "bg-gradient-to-t from-amber-200/80 to-amber-100/20"
                                    : "bg-gradient-to-t from-teal-400/70 to-teal-300/20"
                              )}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[11px] leading-none",
                              isToday ? "text-amber-200/90" : "text-teal-100/60"
                            )}
                          >
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className={cn(GLASS_CARD, "flex flex-col p-6 lg:col-span-2")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-teal-100/60">آخر الجلسات</p>
                    <span
                      aria-hidden="true"
                      className="flex size-8 items-center justify-center rounded-lg bg-teal-300/10 text-teal-300"
                    >
                      <History className="size-4" />
                    </span>
                  </div>

                  {recentSessions.length === 0 ? (
                    <p className="my-auto py-10 text-center text-sm text-teal-100/60">
                      لا ليالٍ مسجّلة بعد — اختر ليلتك من الأعلى وابدأ.
                    </p>
                  ) : (
                    <ul
                      aria-label="آخر جلسات النوم"
                      className="mt-4 max-h-48 space-y-2 overflow-y-auto pe-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-300/20"
                    >
                      {recentSessions.map((session) => (
                        <li
                          key={session.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-teal-50">
                              {session.scene}
                            </p>
                            <p className="mt-0.5 text-xs text-teal-100/60">
                              {formatRelativeTime(session.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-white/10 bg-white/[0.04] text-xs tabular-nums text-teal-200"
                          >
                            ~{session.minutes} د
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
