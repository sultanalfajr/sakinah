import ZAI from "z-ai-web-dev-sdk";
import { STORY_POOL } from "../src/lib/story-pool";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";

/**
 * خطة بديلة للمقاطع العنيدة: تقسيم المقطع الفاشل إلى نصفين عند حدود الجمل،
 * توليد كل نصف على حدة ثم دمجهما بـ ffmpeg في الملف النهائي نفسه.
 * الناتج: public/prebuilt-audio/{id}-{i}.mp3
 */

const OUT_DIR = path.resolve("public/prebuilt-audio");
const TMP_DIR = path.resolve(".prebuild-tmp");
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

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
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => (s.length > maxLen ? hardSplit(s, maxLen) : [s]));
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

/** تقسيم قائمة جمل المقطع إلى نصفين متوازنين تقريبًا */
function splitChunkInTwo(chunk: string): [string, string] {
  const sentences = chunk.match(/[^.!؟?…]+[.!؟?…]*/g) ?? [chunk];
  const total = sentences.reduce((acc, s) => acc + s.length, 0);
  let acc = 0;
  let cut = 1;
  for (let i = 0; i < sentences.length; i++) {
    acc += sentences[i].length;
    if (acc >= total / 2) {
      cut = i + 1;
      break;
    }
  }
  const first = sentences.slice(0, cut).join(" ").trim();
  const second = sentences.slice(cut).join(" ").trim();
  return second ? [first, second] : [chunk, ""];
}

const zai = await ZAI.create();

async function ttsToWav(text: string, outPath: string): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = (await zai.audio.tts.create({
        input: text,
        voice: "tongtong",
        speed: 0.8,
        response_format: "wav",
        stream: false,
      })) as { arrayBuffer: () => Promise<ArrayBuffer> };
      const wav = Buffer.from(new Uint8Array(await res.arrayBuffer()));
      await Bun.write(outPath, wav);
      return;
    } catch (error) {
      console.error(
        `    محاولة ${attempt} فشلت: ${(error as Error).message?.slice(0, 90)}`
      );
      if (attempt === 3) throw error;
      await new Promise((r) => setTimeout(r, attempt === 1 ? 20000 : 45000));
    }
  }
}

async function buildMerged(id: string, index: number, chunk: string): Promise<boolean> {
  const [first, second] = splitChunkInTwo(chunk);
  if (!second) return false;
  const wavA = path.join(TMP_DIR, `${id}-${index}-a.wav`);
  const wavB = path.join(TMP_DIR, `${id}-${index}-b.wav`);
  const outPath = path.join(OUT_DIR, `${id}-${index}.mp3`);
  try {
    console.log(`  ${id}-${index}: نصف أول (${first.length} حرفًا)…`);
    await ttsToWav(first, wavA);
    console.log(`  ${id}-${index}: نصف ثانٍ (${second.length} حرفًا)…`);
    await ttsToWav(second, wavB);
    const proc = Bun.spawnSync([
      "ffmpeg", "-y", "-v", "quiet",
      "-i", wavA, "-i", wavB,
      "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1",
      "-codec:a", "libmp3lame", "-b:a", "48k", "-ac", "1",
      outPath,
    ]);
    if (proc.exitCode !== 0 || !existsSync(outPath)) {
      throw new Error(`ffmpeg exit ${proc.exitCode}`);
    }
    console.log(`  ${id}-${index}.mp3 ✓ (مدمج من نصفين, ${((await Bun.file(outPath).arrayBuffer()).byteLength / 1024).toFixed(0)}KB)`);
    return true;
  } catch (error) {
    console.error(`  ${id}-${index} فشل الدمج: ${(error as Error).message?.slice(0, 90)}`);
    return false;
  } finally {
    rmSync(wavA, { force: true });
    rmSync(wavB, { force: true });
  }
}

let ok = 0;
for (const story of STORY_POOL) {
  const chunks = splitIntoChunks(story.content);
  for (let i = 0; i < chunks.length; i++) {
    const outPath = path.join(OUT_DIR, `${story.id}-${i}.mp3`);
    if (existsSync(outPath)) continue;
    const done = await buildMerged(story.id, i, chunks[i]);
    if (done) ok++;
  }
}
console.log(`[merge-retry] انتهى — نجح ${ok}`);
