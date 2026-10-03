import { eq } from "drizzle-orm";
import { db } from "@/db";
import { textures } from "@/db/schema";
import { getItem } from "@/lib/catalog";
import { bytesResponse } from "@/lib/http";
import { encodePng } from "@/lib/png";
import { buildSingleTextureFileList, singleTextureFilename, zipFiles } from "@/lib/zip-pack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Single-texture export: a complete, installable resource pack containing
 * exactly this one item. Separate from the whole-pack export so one item can
 * be shared or stacked onto another pack on its own.
 */
export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [tex] = await db.select().from(textures).where(eq(textures.id, id)).limit(1);
  if (!tex) return Response.json({ error: "not found" }, { status: 404 });

  const item = getItem(tex.itemId);
  const png = encodePng(tex.resolution, tex.resolution, tex.pixels);
  const files = buildSingleTextureFileList({
    name: item ? item.name : tex.name,
    author: "SkyForge",
    description: `SkyForge single texture — ${tex.name} (${tex.resolution}x${tex.resolution})`,
    itemId: tex.itemId,
    png,
  });
  const zip = await zipFiles(files);

  const url = new URL(request.url);
  const attachment = url.searchParams.get("dl");

  return bytesResponse(
    zip,
    "application/zip",
    attachment
      ? {
          "Content-Disposition": `attachment; filename="${singleTextureFilename(tex.itemId)}"`,
          "Cache-Control": "no-store",
        }
      : { "Cache-Control": "no-store" },
  );
}
