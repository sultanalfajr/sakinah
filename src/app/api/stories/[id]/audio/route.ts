import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readAudio, onCloudflare } from "@/lib/audio-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const indexRaw = req.nextUrl.searchParams.get("i");
  const index = indexRaw === null ? Number.NaN : Number(indexRaw);

  if (
    !/^[\w-]+$/.test(id) ||
    indexRaw === null ||
    !/^\d+$/.test(indexRaw) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 200
  ) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  // 1) المخزن المزدوج (R2 على Cloudflare / db/audio محليًا)
  let hit = await readAudio(id, index);

  // 2) تراجع: الملفات الصوتية المضمنة (تعمل بلا أي مفتاح AI)
  if (!hit) {
    const prebuiltDir = path.resolve(process.cwd(), "public", "prebuilt-audio");
    const prebuiltPath = path.resolve(prebuiltDir, `${id}-${index}.mp3`);
    if (prebuiltPath.startsWith(prebuiltDir + path.sep)) {
      if (await onCloudflare()) {
        // داخل Cloudflare Workers: نحوّل المتصفح إلى الأصل الثابت (CDN مجاني)
        return NextResponse.redirect(
          new URL(`/prebuilt-audio/${id}-${index}.mp3`, req.nextUrl.origin),
          302
        );
      }
      try {
        const buffer = await fs.readFile(prebuiltPath);
        hit = { data: new Uint8Array(buffer), type: "audio/mpeg" };
      } catch {
        hit = null;
      }
    }
  }

  if (!hit) {
    return NextResponse.json({ error: "الملف الصوتي غير موجود" }, { status: 404 });
  }

  return new NextResponse(hit.data, {
    headers: {
      "Content-Type": hit.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
