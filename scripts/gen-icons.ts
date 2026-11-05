/**
 * توليد أيقونات PWA من شعار سَكِينَة المتجهي.
 * التشغيل: bun scripts/gen-icons.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "src/app/icon.svg";
const svg = readFileSync(SRC);

mkdirSync("public/icons", { recursive: true });

/* أيقونات قياسية */
await sharp(svg, { density: 1024 })
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-512.png");
await sharp(svg, { density: 1024 })
  .resize(192, 192)
  .png()
  .toFile("public/icons/icon-192.png");

/* أيقونة maskable — بمساحة أمان على خلفية الموقع */
const inner = await sharp(svg, { density: 1024 })
  .resize(392, 392)
  .png()
  .toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 8, g: 22, b: 28, alpha: 1 },
  },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("public/icons/maskable-512.png");

/* أيقونة iOS (شاشة iOS الرئيسية) */
const apple = await sharp(svg, { density: 1024 }).resize(180, 180).png().toBuffer();
writeFileSync("src/app/apple-icon.png", apple);

console.log("✓ generated: icon-192, icon-512, maskable-512, apple-icon");
