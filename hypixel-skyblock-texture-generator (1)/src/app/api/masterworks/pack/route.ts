import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { packs, textures } from "@/db/schema";
import { getItem } from "@/lib/catalog";
import { nid } from "@/lib/ids";
import { MASTERWORKS } from "@/lib/masterworks";
import { decodePng } from "@/lib/png";
import { toPackDTO } from "@/lib/serialize";

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
  await db.insert(packs).values(pack);

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
  // Insert in chunks; each row carries a 16k-element jsonb.
  for (let i = 0; i < rows.length; i += 12) {
    await db.insert(textures).values(rows.slice(i, i + 12));
  }
  return Response.json({ ...toPackDTO(pack), textureCount: rows.length }, { status: 201 });
}
