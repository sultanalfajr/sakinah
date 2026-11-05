/**
 * معالجة شعار شبكة ضفاف الإعلامية:
 *   • تصغير لعرض التذييل (256px).
 *   • إزالة الخلفية البيضاء الخارجية فقط (Flood-fill من الحواف)
 *     مع الحفاظ على البياض الداخلي للتصميم.
 * التشغيل: bun scripts/gen-dheffaf-logo.ts
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "upload/logo 1.png";
const OUT = "public/dheffaf.png";

const SIZE = 256;
const { data, info } = await sharp(SRC)
  .resize(SIZE, SIZE, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const w = info.width;
const h = info.height;
const px = new Uint8ClampedArray(data);

const lum = (i: number) =>
  0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];

/* Flood-fill من الحواف — يزيل الأبيض الخارجي فقط */
const visited = new Uint8Array(w * h);
const queue: number[] = [];
const push = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const idx = y * w + x;
  if (visited[idx]) return;
  visited[idx] = 1;
  const i = idx * 4;
  if (lum(i) > 238) {
    px[i + 3] = 0; /* شفاف */
    queue.push(idx);
  }
};

for (let x = 0; x < w; x++) {
  push(x, 0);
  push(x, h - 1);
}
for (let y = 0; y < h; y++) {
  push(0, y);
  push(w - 1, y);
}

while (queue.length > 0) {
  const idx = queue.pop() as number;
  const x = idx % w;
  const y = (idx - x) / w;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

/* تنعيم الحواف: بكسلات فاتحة ملاصقة للشفافية تُعطى شفافية جزئية */
const softened = new Uint8ClampedArray(px);
for (let y = 1; y < h - 1; y++) {
  for (let x = 1; x < w - 1; x++) {
    const idx = y * w + x;
    const i = idx * 4;
    if (px[i + 3] === 0) continue;
    const L = lum(i);
    if (L <= 200) continue;
    const nearTransparent =
      px[((y - 1) * w + x) * 4 + 3] === 0 ||
      px[((y + 1) * w + x) * 4 + 3] === 0 ||
      px[(y * w + x - 1) * 4 + 3] === 0 ||
      px[(y * w + x + 1) * 4 + 3] === 0;
    if (nearTransparent) {
      softened[i + 3] = Math.max(0, Math.min(255, ((238 - L) / 38) * 255));
    }
  }
}

await sharp(softened, { raw: { width: w, height: h, channels: 4 } })
  .png()
  .toFile(OUT);

console.log(`✓ ${OUT} — ${w}×${h} بخلفية شفافة`);
