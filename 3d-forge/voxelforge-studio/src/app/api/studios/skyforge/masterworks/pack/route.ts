import { readFile } from "node:fs/promises";
import path from "node:path";
import { insertPack, insertTextures } from "@/studios/skyforge/db/repo";
import { getItem } from "@/studios/skyforge/lib/catalog";
import { nid } from "@/studios/skyforge/lib/ids";
import { MASTERWORKS } from "@/studios/skyforge/lib/masterworks";
import { decodePng } from "@/studios/skyforge/lib/png";
import { toPackDTO } from "@/studios/skyforge/lib/serialize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-click complete pack: every curated masterwork (64×64) is decoded on the
 * server and saved as a new pack owned by the caller, ready for ZIP export and
 * pixel editing in Studio.
 */
export async function POST(request: Request) {
  try {
    return await createPack(request);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) },
      { status: 500 },
    );
  }
}

async function createPack(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    author?: string;
    isPublic?: boolean;
  };
  const name = (body.name ?? "Masterwork Collection").trim().slice(0, 48) || "Masterwork Collection";
  const author = (body.author ?? "Anonymous").trim().slice(0, 32) || "Anonymous";
  const now = new Date();
  const pack = {
    id: nid("pack"),
    name,
    author,
    description: `全${MASTERWORKS.length}点のオリジナル64pxマスターワーク原画で構成された完成パック。スタジオで各ピクセルを編集できます。`,
    resolution: 64,
    styleId: "wither_sovereign",
    signatureId: "overhaul_intricate",
    isPublic: body.isPublic !== false,
    downloads: 0,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };
  await insertPack(pack);

  const rows = [];
  for (const mw of MASTERWORKS) {
    const item = getItem(mw.itemId);
    if (!item) continue;
    const file = path.join(process.cwd(), "public", mw.file);
    const decoded = decodePng(new Uint8Array(await readFile(file)));
    if (decoded.width !== 64 || decoded.height !== 64) continue;
    rows.push({
      id: nid("tex"),
      packId: pack.id,
      itemId: item.id,
      name: item.name,
      category: item.category,
      rarity: item.rarity,
      styleMix: [{ id: "wither_sovereign", weight: 1 }],
      signatureMix: [{ id: "overhaul_intricate", weight: 1 }],
      seed: 0,
      resolution: 64,
      pixels: decoded.pixels,
      hueShift: 0,
      glow: 0,
      metallic: 0,
      chaos: 0,
      templateId: `masterwork:${item.id}`,
      createdAt: now,
      updatedAt: now,
    });
  }
  // 挿入は 12 行ごと (1 行あたり 16k 要素の jsonb)。insertTextures が同じ刻みで処理する。
  await insertTextures(rows);
  return Response.json({ ...toPackDTO(pack), textureCount: rows.length }, { status: 201 });
}
