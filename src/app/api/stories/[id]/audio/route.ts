import { NextResponse, type NextRequest } from "next/server";
import { readAudio } from "@/lib/audio-store";

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

  // الصيغة الحالية wav، مع تراجع آمن لأي مقاطع mp3 قديمة — يُدار داخل المخزن المزدوج
  const hit = await readAudio(id, index);
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
