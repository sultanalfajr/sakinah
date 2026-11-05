import ZAI from "z-ai-web-dev-sdk";

/**
 * توليد مجموعة قصص جاهزة (pool) تُضمَّن في الكود ليعمل التطبيق بلا مفتاح AI
 * الناتج: src/lib/story-pool.ts
 */

const SYSTEM_PROMPT =
  "أنت راوٍ قصص نوم بالعربية. تكتب قصة هادئة جدًا بالضوضاء البيضاء اللغوية: جمل طويلة بطيئة، أوصاف حسّية دافئة، بضمير المخاطب (أنت)، بلا أي حبكة مثيرة أو صراع أو مفاجآت، تنتهي القصة بنومٍ عميق تدريجي. أعد النتيجة بصيغة JSON فقط: {\"title\": \"...\", \"content\": \"...\"} دون أي نص آخر.";

const THEMES = [
  "حديقةُ الأمطار الأولى",
  "بيتُ الجدّ في الريف",
  "جزيرةٌ تنام في الضباب",
  "مخبزٌ ليليّ يبرد خبزه بهدوء",
  "مزرعةُ اللافندر تحت النجوم",
  "ساحةُ قريةٍ نائمة تحت الثلج",
];

type Pooled = { id: string; title: string; theme: string; content: string };

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

async function generateOne(zai: Awaited<ReturnType<typeof ZAI.create>>, theme: string): Promise<Pooled | null> {
  const userPrompt = `اكتب قصة نوم هادئة موضوعها: «${theme}». يجب أن تكون القصة بالعربية من 600 إلى 850 كلمة، بضمير المخاطب (أنت)، بجملٍ طويلة بطيئة وأوصافٍ حسّية دافئة، بلا أي حبكة أو صراع أو مفاجآت، وتنتهي بنومٍ عميق تدريجي. أعد النتيجة بصيغة JSON فقط بهذا الشكل: {"title": "...", "content": "..."} دون أي نص آخر.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = (await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      })) as { choices?: Array<{ message?: { content?: string } }> } | null;

      const text = completion?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJson(text);
      const title = typeof parsed?.title === "string" ? parsed.title.trim() : "";
      const content = typeof parsed?.content === "string" ? parsed.content.trim() : "";
      if (title && content && content.length > 1500) {
        return { id: "", title, theme, content };
      }
      console.log(`[pool] ${theme}: محاولة ${attempt + 1} — محتوى غير كافٍ (${content.length})`);
    } catch (error) {
      console.error(`[pool] ${theme}: خطأ محاولة ${attempt + 1}:`, (error as Error).message?.slice(0, 120));
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

const zai = await ZAI.create();
const results: Pooled[] = [];
for (let i = 0; i < THEMES.length; i++) {
  const theme = THEMES[i];
  console.log(`[pool] (${i + 1}/${THEMES.length}) توليد: ${theme}`);
  const story = await generateOne(zai, theme);
  if (story) {
    story.id = `p${i + 1}`;
    results.push(story);
    const words = story.content.trim().split(/\s+/).length;
    console.log(`[pool] ✓ ${story.title} — ${words} كلمة`);
  } else {
    console.log(`[pool] ✗ فشل: ${theme}`);
  }
}

// كتابة ملف TS
const ts = `/**
 * مجموعة قصص جاهزة مُولّدة مسبقًا — تعمل بلا أي مفتاح ذكاء اصطناعي.
 * يستهلك POST /api/stories منها بالتناوب عند تعذّر التوليد الحيّ.
 * المعرفات ثابتة (p1..p6) لمطابقة ملفات الصوت المضمنة.
 */

export type PoolStory = {
  id: string;
  title: string;
  theme: string;
  content: string;
};

export const STORY_POOL: PoolStory[] = ${JSON.stringify(results, null, 2)};
`;
await Bun.write("src/lib/story-pool.ts", ts);
console.log(`[pool] تم — ${results.length} قصة في src/lib/story-pool.ts`);
