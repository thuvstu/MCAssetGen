import { insertPack, listPacksByCreated } from "@/studios/skyforge/db/repo";
import { nid } from "@/studios/skyforge/lib/ids";
import { toPackDTO } from "@/studios/skyforge/lib/serialize";
import { DEFAULT_PALETTE, DEFAULT_SIGNATURE } from "@/studios/skyforge/lib/generate";
import { PALETTES, SIGNATURES } from "@/studios/skyforge/lib/styles";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listPacksByCreated();
  return Response.json(rows.map(toPackDTO));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    author?: string;
    description?: string;
    resolution?: number;
    styleId?: string;
    signatureId?: string;
    isPublic?: boolean;
  };

  const name = (body.name ?? "").trim().slice(0, 48);
  if (name.length < 1) {
    return Response.json({ error: "名前を入力してください" }, { status: 400 });
  }

  const resolution = body.resolution === 64 ? 64 : body.resolution === 32 ? 32 : 16;
  const styleId = PALETTES.some((s) => s.id === body.styleId) ? body.styleId! : DEFAULT_PALETTE;
  const signatureId = SIGNATURES.some((s) => s.id === body.signatureId)
    ? body.signatureId!
    : DEFAULT_SIGNATURE;
  const now = new Date();

  const row = {
    id: nid("pack"),
    name,
    author: (body.author ?? "Anonymous").trim().slice(0, 32) || "Anonymous",
    description: (body.description ?? "").trim().slice(0, 280),
    resolution,
    styleId,
    signatureId,
    isPublic: body.isPublic !== false,
    downloads: 0,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };

  await insertPack(row);
  return Response.json(toPackDTO(row));
}
