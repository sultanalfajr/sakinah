import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

  const audioDir = path.resolve(process.cwd(), "db", "audio");
  // الصيغة الحالية wav، مع تراجع آمن لأي مقاطع mp3 قديمة
  const candidates: { file: string; type: string }[] = [
    { file: `${id}-${index}.wav`, type: "audio/wav" },
    { file: `${id}-${index}.mp3`, type: "audio/mpeg" },
  ];
  let hit: { file: string; type: string } | null = null;
  for (const c of candidates) {
    const p = path.resolve(audioDir, c.file);
    if (p === audioDir || !p.startsWith(audioDir + path.sep)) {
      return NextResponse.json({ error: "مسار غير صالح" }, { status: 400 });
    }
    try {
      await fs.access(p);
      hit = { ...c, file: p };
      break;
    } catch {
      continue;
    }
  }
  if (!hit) {
    return NextResponse.json({ error: "الملف الصوتي غير موجود" }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(hit.file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": hit.type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "الملف الصوتي غير موجود" }, { status: 404 });
  }
}
