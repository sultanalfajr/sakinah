import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RIYADH_TZ = "Asia/Riyadh";
const DAY_MS = 86_400_000;
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;
const MAX_SCENE_LENGTH = 80;
const PROFILE_ID = "main";

/** 'YYYY-MM-DD' لتوقيت الرياض (offset ثابت +03:00 — بلا توقيت صيفي). */
function riyadhDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: RIYADH_TZ }).format(date);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "صيغة الطلب غير صحيحة" }, { status: 400 });
  }

  const parsed = (body ?? {}) as { minutes?: unknown; scene?: unknown };

  const minutes = Math.round(Number(parsed.minutes));
  if (!Number.isFinite(minutes) || minutes < MIN_MINUTES || minutes > MAX_MINUTES) {
    return NextResponse.json(
      {
        error: `مدة الجلسة غير صالحة — يجب أن تكون بين ${MIN_MINUTES} و${MAX_MINUTES} دقيقة`,
      },
      { status: 400 },
    );
  }

  const scene = typeof parsed.scene === "string" ? parsed.scene.trim() : "";
  if (!scene) {
    return NextResponse.json({ error: "اسم المشهد مطلوب" }, { status: 400 });
  }
  if (scene.length > MAX_SCENE_LENGTH) {
    return NextResponse.json(
      { error: `اسم المشهد طويل جدًا — الحد الأقصى ${MAX_SCENE_LENGTH} حرفًا` },
      { status: 400 },
    );
  }

  try {
    const now = new Date();
    const today = riyadhDateString(now);
    const yesterday = riyadhDateString(new Date(now.getTime() - DAY_MS));

    await db.session.create({ data: { scene, minutes } });

    const existing = await db.profile.findUnique({ where: { id: PROFILE_ID } });
    const prev = existing ?? {
      streak: 0,
      longestStreak: 0,
      totalMinutes: 0,
      nightsCount: 0,
      lastSessionDate: null as string | null,
    };

    let streak: number;
    let nightsCount: number;

    if (prev.lastSessionDate === today) {
      // جلسة إضافية في الليلة نفسها: السلسلة والليالي لا تتغيّران
      streak = prev.streak;
      nightsCount = prev.nightsCount;
    } else if (prev.lastSessionDate === yesterday) {
      // امتداد للسلسلة: ليلة جديدة متتالية
      streak = prev.streak + 1;
      nightsCount = prev.nightsCount + 1;
    } else {
      // انقطعت السلسلة: نبدأ من جديد
      streak = 1;
      nightsCount = prev.nightsCount + 1;
    }

    const longestStreak = Math.max(prev.longestStreak, streak);
    const totalMinutes = prev.totalMinutes + minutes;
    const lastSessionDate = today;

    const profile = await db.profile.upsert({
      where: { id: PROFILE_ID },
      update: { streak, longestStreak, totalMinutes, nightsCount, lastSessionDate },
      create: {
        id: PROFILE_ID,
        streak,
        longestStreak,
        totalMinutes,
        nightsCount,
        lastSessionDate,
      },
    });

    return NextResponse.json({
      profile: {
        streak: profile.streak,
        longestStreak: profile.longestStreak,
        totalMinutes: profile.totalMinutes,
        nightsCount: profile.nightsCount,
        lastSessionDate: profile.lastSessionDate,
      },
    });
  } catch (error) {
    console.error("POST /api/sessions failed:", error);
    return NextResponse.json({ error: "تعذّر تسجيل الجلسة" }, { status: 500 });
  }
}
