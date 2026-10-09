import { listTexturesByPack } from "@/studios/skyforge/db/repo";
import { bytesResponse } from "@/studios/skyforge/lib/http";
import { composeCollage, encodePng } from "@/studios/skyforge/lib/png";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const texRows = await listTexturesByPack(id);
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
