import { NextResponse } from "next/server";
import { ttsAudio, AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai";
import { saveAudio, removeStoryAudio } from "@/lib/audio-store";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const MAX_CHUNK_LENGTH = 800;
const MAX_CHUNK_INDEX = 200;

// تقسيم جملة واحدة أطول من الحد الأقصى عند أقرب مسافة
function hardSplit(sentence: string, maxLen: number): string[] {
  const parts: string[] = [];
  let rest = sentence.trim();
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(" ", maxLen);
    if (cut < maxLen / 2) cut = maxLen;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

// تقسيم النص إلى مقاطع ≤800 حرف عند حدود الجمل العربية مع الإبقاء على علامات الترقيم
function splitIntoChunks(content: string, maxLen = MAX_CHUNK_LENGTH): string[] {
  const rawSentences = content.match(/[^.!؟?…\n]+[.!؟?…\n]*/g) ?? [content];
  const sentences = rawSentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .flatMap((sentence) => (sentence.length > maxLen ? hardSplit(sentence, maxLen) : [sentence]));

  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && candidate.length > maxLen) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const story = await db.story.findUnique({ where: { id } });
    if (!story) {
      return NextResponse.json({ error: "القصة غير موجودة" }, { status: 404 });
    }

    const chunks = splitIntoChunks(story.content);
    if (chunks.length === 0 || chunks.length > MAX_CHUNK_INDEX + 1) {
      return NextResponse.json(
        { error: "نص القصة غير صالح للرواية الصوتية" },
        { status: 400 }
      );
    }

    // حذف أي ملفات صوت قديمة لهذه القصة قبل التوليد
    await removeStoryAudio(id);

    try {
      // توليد تسلسلي للمقاطع تفاديًا لقيود المعدل
      for (let i = 0; i < chunks.length; i++) {
        const arrayBuffer = await ttsAudio(chunks[i]);
        const buffer = new Uint8Array(arrayBuffer);
        await saveAudio(id, i, buffer, "wav");
      }
    } catch (error) {
      // تنظيف الملفات الجزئية عند الفشل
      await removeStoryAudio(id);
      if (error instanceof Error && error.message.includes("AI tts failed")) {
        return NextResponse.json({ error: AI_NOT_CONFIGURED_MESSAGE }, { status: 503 });
      }
      throw error;
    }

    await db.story.update({ where: { id }, data: { hasAudio: true } });

    return NextResponse.json({ chunkCount: chunks.length });
  } catch (error) {
    console.error("POST /api/stories/[id]/narrate error:", error);
    return NextResponse.json(
      { error: "تعذّر تجهيز الرواية الصوتية، أعد المحاولة" },
      { status: 500 }
    );
  }
}
