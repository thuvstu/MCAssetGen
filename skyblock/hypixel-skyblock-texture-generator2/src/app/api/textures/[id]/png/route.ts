import { eq } from "drizzle-orm";
import { db } from "@/db";
import { textures } from "@/db/schema";
import { bytesResponse } from "@/lib/http";
import { encodePng } from "@/lib/png";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PNG delivery for one texture. `?dl=1` adds a real filename so a single
 * texture can be saved straight to disk without a browser-guessed name.
 */
export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [tex] = await db.select().from(textures).where(eq(textures.id, id)).limit(1);
  if (!tex) return new Response("not found", { status: 404 });
  const png = encodePng(tex.resolution, tex.resolution, tex.pixels);
  const url = new URL(request.url);
  const download = url.searchParams.get("dl");
  return bytesResponse(png, "image/png", {
    "Cache-Control": "public, max-age=60",
    "X-SkyForge-Resolution": `${tex.resolution}x${tex.resolution}`,
    "X-SkyForge-Render-Mode": tex.resolution === 64 ? "native64" : tex.resolution === 32 ? "refined32" : "classic16",
    ...(download
      ? {
          "Content-Disposition": `attachment; filename="${tex.itemId}-${tex.resolution}px.png"`,
        }
      : {}),
  });
}
