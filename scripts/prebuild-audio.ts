import { BUILTIN_STORIES } from "../src/lib/builtin-stories";
import { STORY_POOL } from "../src/lib/story-pool";
import ZAI from "z-ai-web-dev-sdk";
import { mkdirSync, existsSync, rmSync } from "fs";
import path from "path";

/**
 * توليد الصوت المضمن مسبقًا (MP3) لكل القصص ذات المعرفات الثابتة:
 *   b1..b3  القصص المضمنة الثلاث
 *   p1..p6  قصص المجموعة الجاهزة
 * الناتج: public/prebuilt-audio/{id}-{i}.mp3
 * يعمل بلا أي مفتاح AI لاحقًا — يُشغّل مرة واحدة هنا حيث يتوفر SDK
 */

const OUT_DIR = path.resolve("public/prebuilt-audio");
const TMP_DIR = path.resolve(".prebuild-tmp");
const BITRATE = "48k";

// نفس منطق التقسيم الموجود في مسار narrate
const MAX_CHUNK_LENGTH = 800;

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

function splitIntoChunks(content: string, maxLen = MAX_CHUNK_LENGTH): string[] {
  const rawSentences = content.match(/[^.!؟?…\n]+[.!؟?…\n]*/g) ?? [content];
  const sentences = rawSentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .flatMap((sentence) =>
      sentence.length > maxLen ? hardSplit(sentence, maxLen) : [sentence]
    );

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

type Target = { id: string; title: string; content: string };

const targets: Target[] = [
  ...BUILTIN_STORIES.map((story, index) => ({
    id: `b${index + 1}`,
    title: story.title,
    content: story.content,
  })),
  ...STORY_POOL.map((story) => ({
    id: story.id,
    title: story.title,
    content: story.content,
  })),
];

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

const zai = await ZAI.create();
let totalChunks = 0;
let generated = 0;
let skipped = 0;

for (const target of targets) {
  const chunks = splitIntoChunks(target.content);
  console.log(`\n=== ${target.id}: ${target.title} — ${chunks.length} مقاطع ===`);
  totalChunks += chunks.length;

  for (let i = 0; i < chunks.length; i++) {
    const outPath = path.join(OUT_DIR, `${target.id}-${i}.mp3`);
    if (existsSync(outPath)) {
      skipped++;
      continue;
    }

    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        const start = Date.now();
        const res = (await zai.audio.tts.create({
          input: chunks[i],
          voice: "tongtong",
          speed: 0.8,
          response_format: "wav",
          stream: false,
        })) as { arrayBuffer: () => Promise<ArrayBuffer> };
        const wav = Buffer.from(new Uint8Array(await res.arrayBuffer()));
        const tmpWav = path.join(TMP_DIR, `${target.id}-${i}.wav`);
        await Bun.write(tmpWav, wav);

        const proc = Bun.spawnSync([
          "ffmpeg",
          "-y",
          "-v",
          "quiet",
          "-i",
          tmpWav,
          "-codec:a",
          "libmp3lame",
          "-b:a",
          BITRATE,
          "-ac",
          "1",
          outPath,
        ]);
        if (proc.exitCode !== 0 || !existsSync(outPath)) {
          throw new Error(`ffmpeg exit ${proc.exitCode}`);
        }
        rmSync(tmpWav, { force: true });
        generated++;
        console.log(
          `  ${target.id}-${i}.mp3 ✓ (${((Date.now() - start) / 1000).toFixed(1)}s, ${(wav.length / 1024).toFixed(0)}KB wav)`
        );
        done = true;
      } catch (error) {
        console.error(
          `  ${target.id}-${i} محاولة ${attempt} فشلت: ${(error as Error).message?.slice(0, 100)}`
        );
        // تراجع تدريجي طويل لتفادي حد المعدل (429)
        await new Promise((r) => setTimeout(r, attempt === 1 ? 20000 : attempt === 2 ? 45000 : 90000));
      }
    }
    if (!done) {
      console.error(`  ✗ استسلام: ${target.id}-${i}`);
    }
  }
}

console.log(
  `\n[prebuild] اكتمل — أُنشئ ${generated}، موجود مسبقًا ${skipped}، من إجمالي ${totalChunks}`
);
