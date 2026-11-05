import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import { STORY_POOL } from "@/lib/story-pool";
import { BUILTIN_STORIES, PREBUILT_AUDIO_IDS } from "@/lib/builtin-stories";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "أنت راوٍ قصص نوم بالعربية. تكتب قصة هادئة جدًا بالضوضاء البيضاء اللغوية: جمل طويلة بطيئة، أوصاف حسّية دافئة، بضمير المخاطب (أنت)، بلا أي حبكة مثيرة أو صراع أو مفاجآت، تنتهي القصة بنومٍ عميق تدريجي. أعد النتيجة بصيغة JSON فقط: {\"title\": \"...\", \"content\": \"...\"} دون أي نص آخر.";

// موضوعات هادئة نختار منها تلقائيًا إذا لم يدوّن المستخدم شيئًا
const CALM_THEMES = [
  "المطر على النوافذ",
  "ضوء القمر على البحر",
  "الغابة بعد الغروب",
  "ثلجٌ يتساقط على قرية نائمة",
  "حديقةٌ هادئة في ضوء الفوانيس",
];


// مزامنة التهيئة داخل العملية الواحدة حتى لا تتكرر القصص المضمّنة
let seedPromise: Promise<void> | null = null;

// معرفات ثابتة للقصص المضمنة — لمطابقة ملفات الصوت المضمنة
const BUILTIN_IDS = ["b1", "b2", "b3"] as const;

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      // نتحقق من القصص المضمنة تحديدًا (وليس كل القصص)
      const builtinCount = await db.story.count({ where: { isBuiltin: true } });
      if (builtinCount === 0) {
        const now = Date.now();
        await db.story.createMany({
          data: BUILTIN_STORIES.map((story, index) => ({
            ...story,
            id: BUILTIN_IDS[index],
            hasAudio: PREBUILT_AUDIO_IDS.includes(BUILTIN_IDS[index]),
            createdAt: new Date(now + index * 1000),
          })),
        });
      }
    })().catch((error: unknown) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

function extractJson(text: string): { title?: unknown; content?: unknown } | null {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as { title?: unknown; content?: unknown };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await ensureSeeded();
    const stories = await db.story.findMany({
      orderBy: [{ isBuiltin: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ stories });
  } catch (error) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json(
      { error: "تعذّر تحميل القصص، أعد المحاولة" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { theme?: unknown };
    const theme = typeof body.theme === "string" ? body.theme.trim() : "";
    if (theme.length > 60) {
      return NextResponse.json(
        { error: "الموضوع طويل جدًا، اجعله في حدود 60 حرفًا" },
        { status: 400 }
      );
    }
    const finalTheme =
      theme || CALM_THEMES[Math.floor(Math.random() * CALM_THEMES.length)];

    const userPrompt = `اكتب قصة نوم هادئة موضوعها: «${finalTheme}». يجب أن تكون القصة بالعربية من 700 إلى 1000 كلمة، بضمير المخاطب (أنت)، بجملٍ طويلة بطيئة وأوصافٍ حسّية دافئة، بلا أي حبكة أو صراع أو مفاجآت، وتنتهي بنومٍ عميق تدريجي. أعد النتيجة بصيغة JSON فقط بهذا الشكل: {"title": "...", "content": "..."} دون أي نص آخر.`;

    let text: string | null = null;
    try {
      text = await chatCompletion([
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ]);
    } catch (aiError) {
      // بلا مفتاح AI (أو فشل المزوّد): نخدم قصة جاهزة من المجموعة المضمنة
      console.error(
        "AI chat unavailable, falling back to story pool:",
        aiError instanceof Error ? aiError.message.slice(0, 120) : aiError
      );
    }

    if (text) {
      const parsed = extractJson(text);
      let title = typeof parsed?.title === "string" ? parsed.title.trim() : "";
      let content = typeof parsed?.content === "string" ? parsed.content.trim() : "";

      // احتياط: إذا فشل تحليل JSON نعامل السطر الأول عنوانًا والباقي نصًا
      if (!title || !content) {
        const cleaned = text.replace(/```(?:json)?/gi, "").trim();
        const newlineIndex = cleaned.indexOf("\n");
        const fallbackTitle =
          newlineIndex === -1 ? cleaned : cleaned.slice(0, newlineIndex).trim();
        const fallbackContent =
          newlineIndex === -1 ? "" : cleaned.slice(newlineIndex + 1).trim();
        if (!title) title = fallbackTitle;
        if (!content) content = fallbackContent;
      }

      if (!title || !content) {
        return NextResponse.json(
          { error: "جاءت الإجابة غير مكتملة، أعد المحاولة" },
          { status: 500 }
        );
      }

      const words = content.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(15, Math.round(words / 120));

      const story = await db.story.create({
        data: {
          title,
          theme: finalTheme,
          content,
          minutes,
          isBuiltin: false,
          hasAudio: false,
        },
      });

      return NextResponse.json(story);
    }

    // ————— بديل المجموعة الجاهزة (بلا ذكاء اصطناعي) —————
    const existingIds = new Set(
      (await db.story.findMany({ select: { id: true } })).map((row) => row.id)
    );
    const next = STORY_POOL.find((candidate) => !existingIds.has(candidate.id));
    if (!next) {
      return NextResponse.json(
        { error: "قرأتَ كل القصص الجاهزة حاليًا 🌙 أعد المحاولة لاحقًا" },
        { status: 503 }
      );
    }
    const poolWords = next.content.trim().split(/\s+/).filter(Boolean).length;
    const poolMinutes = Math.max(12, Math.round(poolWords / 120));
    const story = await db.story.create({
      data: {
        id: next.id,
        title: next.title,
        theme: finalTheme,
        content: next.content,
        minutes: poolMinutes,
        isBuiltin: false,
        hasAudio: PREBUILT_AUDIO_IDS.includes(next.id),
      },
    });
    return NextResponse.json(story);
  } catch (error) {
    console.error("POST /api/stories error:", error);
    return NextResponse.json(
      { error: "تعذّر نسج القصة، أعد المحاولة" },
      { status: 500 }
    );
  }
}
