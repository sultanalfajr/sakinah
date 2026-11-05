import { promises as fs } from "fs";
import path from "path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * مخزن صوتي مزدوج:
 * - على Cloudflare Workers: يخزّن المقاطع في R2 (ربط AUDIO)
 * - محلياً: يخزّنها في db/audio على القرص
 */

// واجهة دنيا لـ R2 حتى لا نحتاج @cloudflare/workers-types
export interface R2Like {
  get(key: string): Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>;
  put(key: string, value: ArrayBuffer | Uint8Array | string): Promise<unknown>;
  delete(keys: string | string[]): Promise<unknown>;
  list(options: { prefix: string; limit?: number }): Promise<{
    objects: Array<{ key: string }>;
  }>;
}

const AUDIO_DIR = path.join(process.cwd(), "db", "audio");

async function getBucket(): Promise<R2Like | null> {
  try {
    const { env } = getCloudflareContext() as unknown as { env: { AUDIO?: R2Like } };
    return env?.AUDIO ?? null;
  } catch {
    return null;
  }
}

/** هل نعمل داخل Cloudflare Workers؟ */
export async function onCloudflare(): Promise<boolean> {
  try {
    getCloudflareContext();
    return true;
  } catch {
    return false;
  }
}

function keyFor(id: string, index: number, format: string): string {
  return `audio/${id}-${index}.${format}`;
}

/** حفظ مقطع صوتي (wav أو mp3) */
export async function saveAudio(
  id: string,
  index: number,
  data: Uint8Array,
  format: "wav" | "mp3"
): Promise<void> {
  const bucket = await getBucket();
  if (bucket) {
    await bucket.put(keyFor(id, index, format), data);
    return;
  }
  await fs.mkdir(AUDIO_DIR, { recursive: true });
  await fs.writeFile(path.join(AUDIO_DIR, `${id}-${index}.${format}`), data);
}

/** قراءة مقطع صوتي — يجرّب wav ثم mp3 */
export async function readAudio(
  id: string,
  index: number
): Promise<{ data: Uint8Array; type: string } | null> {
  const candidates: { format: string; type: string }[] = [
    { format: "wav", type: "audio/wav" },
    { format: "mp3", type: "audio/mpeg" },
  ];

  const bucket = await getBucket();
  if (bucket) {
    for (const c of candidates) {
      try {
        const obj = await bucket.get(keyFor(id, index, c.format));
        if (obj) {
          const buffer = await obj.arrayBuffer();
          return { data: new Uint8Array(buffer), type: c.type };
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  for (const c of candidates) {
    try {
      const buffer = await fs.readFile(path.join(AUDIO_DIR, `${id}-${index}.${c.format}`));
      return { data: new Uint8Array(buffer), type: c.type };
    } catch {
      continue;
    }
  }
  return null;
}

/** حذف كل المقاطع الصوتية الخاصة بقصة */
export async function removeStoryAudio(id: string): Promise<void> {
  const bucket = await getBucket();
  if (bucket) {
    try {
      const listed = await bucket.list({ prefix: `audio/${id}-`, limit: 500 });
      const keys = listed.objects.map((o) => o.key);
      if (keys.length) await bucket.delete(keys);
    } catch {
      // لا شيء لحذفه
    }
    return;
  }
  try {
    const existing = await fs.readdir(AUDIO_DIR);
    const targets = existing.filter(
      (file) => file.startsWith(`${id}-`) && (file.endsWith(".mp3") || file.endsWith(".wav"))
    );
    await Promise.all(targets.map((file) => fs.unlink(path.join(AUDIO_DIR, file))));
  } catch {
    // لا شيء لحذفه
  }
}
