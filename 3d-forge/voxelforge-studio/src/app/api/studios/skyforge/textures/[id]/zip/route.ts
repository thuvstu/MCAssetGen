import JSZip from "jszip";
import { getTexture } from "@/studios/skyforge/db/repo";
import { getItem } from "@/studios/skyforge/lib/catalog";
import { attachmentDisposition, bytesResponse } from "@/studios/skyforge/lib/http";
import { citProperties, packMcmeta, sanitizeFilename } from "@/studios/skyforge/lib/pack-files";
import { encodePng, resizeNearest } from "@/studios/skyforge/lib/png";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Single-texture export as a one-item OptiFine CIT resource pack.
 * GET /api/textures/[id]/zip?size=16|32|64  (size = output resolution)
 */
export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const tex = await getTexture(id);
  if (!tex) return Response.json({ error: "not found" }, { status: 404 });
  const item = getItem(tex.itemId);
  if (!item) return Response.json({ error: "unknown item" }, { status: 404 });

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("size"));
  const size = [16, 32, 64].includes(requested) ? requested : tex.resolution;
  const source =
    size === tex.resolution
      ? { width: tex.resolution, height: tex.resolution, pixels: tex.pixels }
      : resizeNearest(tex.pixels, tex.resolution, tex.resolution, size, size);

  const png = encodePng(source.width, source.height, source.pixels);
  const zip = new JSZip();
  zip.file("pack.mcmeta", packMcmeta(`${item.name} — SkyForge single`, `${size}px single-item pack`));
  zip.file("textures/texture.png", png as unknown as Uint8Array);
  zip.file("assets/minecraft/optifine/cit/skyforge/texture.png", png as unknown as Uint8Array);
  zip.file("assets/minecraft/optifine/cit/skyforge/texture.properties", citProperties({ ...item, id: "texture" }));
  const out = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

  return bytesResponse(out, "application/zip", {
    "Content-Disposition": attachmentDisposition(`${sanitizeFilename(item.id)}_${size}.zip`),
    "Cache-Control": "no-store",
    "X-SkyForge-Texture": item.id,
    "X-SkyForge-Output-Size": `${size}x${size}`,
  });
}

export async function POST(request: Request, ctx: Ctx) {
  // convenience alias so client code can trigger the same download via fetch
  return GET(request, ctx);
}
