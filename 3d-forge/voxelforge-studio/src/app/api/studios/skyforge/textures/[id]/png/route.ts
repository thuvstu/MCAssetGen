import { getTexture } from "@/studios/skyforge/db/repo";
import { bytesResponse } from "@/studios/skyforge/lib/http";
import { encodePng, resizeNearest } from "@/studios/skyforge/lib/png";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const tex = await getTexture(id);
  if (!tex) return new Response("not found", { status: 404 });
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("size"));
  const size = [16, 32, 64].includes(requested) ? requested : tex.resolution;
  const source =
    size === tex.resolution
      ? { width: tex.resolution, height: tex.resolution, pixels: tex.pixels }
      : resizeNearest(tex.pixels, tex.resolution, tex.resolution, size, size);
  const png = encodePng(source.width, source.height, source.pixels);
  return bytesResponse(png, "image/png", {
    "Cache-Control": "public, max-age=60",
    "X-SkyForge-Resolution": `${tex.resolution}x${tex.resolution}`,
    "X-SkyForge-Render-Mode": tex.resolution === 64 ? "native64" : tex.resolution === 32 ? "refined32" : "classic16",
  });
}
