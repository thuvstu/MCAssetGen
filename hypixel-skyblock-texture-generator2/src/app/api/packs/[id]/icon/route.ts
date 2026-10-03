import { eq } from "drizzle-orm";
import { db } from "@/db";
import { textures } from "@/db/schema";
import { bytesResponse } from "@/lib/http";
import { composeCollage, encodePng } from "@/lib/png";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const texRows = await db.select().from(textures).where(eq(textures.packId, id));
  if (!texRows.length) return new Response("not found", { status: 404 });
  const collage = composeCollage(
    texRows.slice(0, 4).map((t) => ({
      pixels: t.pixels,
      width: t.resolution,
      height: t.resolution,
    })),
    128,
  );
  const png = encodePng(collage.width, collage.height, collage.pixels);
  return bytesResponse(png, "image/png", { "Cache-Control": "public, max-age=30" });
}
