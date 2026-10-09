import { getItem } from "@/studios/skyforge/lib/catalog";
import { DEFAULT_PALETTE, DEFAULT_SIGNATURE, generateTexture } from "@/studios/skyforge/lib/generate";
import { isRarity } from "@/studios/skyforge/lib/rarity";
import type { MixEntry } from "@/studios/skyforge/lib/styles";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    itemId?: string;
    resolution?: number;
    seed?: number;
    styleMix?: MixEntry[];
    signatureMix?: MixEntry[];
    rarity?: string;
    hueShift?: number;
    glow?: number;
    metallic?: number;
    chaos?: number;
    templateId?: string;
  };

  const item = body.itemId ? getItem(body.itemId) : undefined;
  if (!item) return Response.json({ error: "unknown item" }, { status: 400 });

  const generated = generateTexture({
    itemId: item.id,
    resolution: body.resolution === 64 ? 64 : body.resolution === 32 ? 32 : 16,
    seed: Number.isFinite(body.seed) ? Math.floor(Number(body.seed)) : 1,
    styleMix:
      Array.isArray(body.styleMix) && body.styleMix.length
        ? body.styleMix
        : [{ id: DEFAULT_PALETTE, weight: 1 }],
    signatureMix:
      Array.isArray(body.signatureMix) && body.signatureMix.length
        ? body.signatureMix
        : [{ id: DEFAULT_SIGNATURE, weight: 1 }],
    rarity: body.rarity && isRarity(body.rarity) ? body.rarity : item.rarity,
    hueShift: Math.max(-180, Math.min(180, Math.round(body.hueShift ?? 0))),
    glow: Math.max(0, Math.min(100, Math.round(body.glow ?? 40))),
    metallic: Math.max(0, Math.min(100, Math.round(body.metallic ?? 45))),
    chaos: Math.max(0, Math.min(100, Math.round(body.chaos ?? 25))),
    templateId: body.templateId,
  });

  return Response.json(generated);
}
