import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RIYADH_TZ = "Asia/Riyadh";
const RIYADH_OFFSET = "+03:00";
const DAY_MS = 86_400_000;
const PROFILE_ID = "main";

/** 'YYYY-MM-DD' لتوقيت الرياض (offset ثابت +03:00 — بلا توقيت صيفي). */
function riyadhDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: RIYADH_TZ }).format(date);
}

/** اسم اليوم المختصر بالعربية لتوقيت الرياض. */
function riyadhWeekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat("ar", { weekday: "short", timeZone: RIYADH_TZ }).format(date);
}

export async function GET() {
  try {
    const now = new Date();
    const today = riyadhDateString(now);
    const todayStartUtc = Date.parse(`${today}T00:00:00${RIYADH_OFFSET}`);

    // آخر 7 ليالٍ (الأقدم ← الأحدث) بحسب توقيت الرياض
    const days = Array.from({ length: 7 }, (_, index) => {
      const startUtc = todayStartUtc - (6 - index) * DAY_MS;
      return {
        date: riyadhDateString(new Date(startUtc)),
        startUtc,
        endUtc: startUtc + DAY_MS - 1,
      };
    });

    const weekSessions = await db.session.findMany({
      where: {
        createdAt: {
          gte: new Date(days[0].startUtc),
          lte: new Date(days[days.length - 1].endUtc),
        },
      },
      select: { minutes: true, createdAt: true },
    });

    const minutesByDate = new Map<string, number>();
    for (const session of weekSessions) {
      const key = riyadhDateString(session.createdAt);
      minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + session.minutes);
    }

    const week = days.map((day) => ({
      date: day.date,
      label: riyadhWeekdayLabel(new Date(day.startUtc)),
      minutes: minutesByDate.get(day.date) ?? 0,
    }));

    const [profile, recentSessions] = await Promise.all([
      db.profile.upsert({
        where: { id: PROFILE_ID },
        update: {},
        create: { id: PROFILE_ID },
      }),
      db.session.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      profile: {
        streak: profile.streak,
        longestStreak: profile.longestStreak,
        totalMinutes: profile.totalMinutes,
        nightsCount: profile.nightsCount,
        lastSessionDate: profile.lastSessionDate,
      },
      week,
      recentSessions,
    });
  } catch (error) {
    console.error("GET /api/profile failed:", error);
    return NextResponse.json({ error: "تعذّر تحميل الإحصاءات" }, { status: 500 });
  }
}
