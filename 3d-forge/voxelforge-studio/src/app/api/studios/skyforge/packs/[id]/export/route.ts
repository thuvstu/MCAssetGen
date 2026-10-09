import { bumpPackDownloads, getPack, listTexturesByPack } from "@/studios/skyforge/db/repo";
import { attachmentDisposition, bytesResponse } from "@/studios/skyforge/lib/http";
import { composeCollage, encodePng } from "@/studios/skyforge/lib/png";
import { buildPackFileList, downloadFilename, zipFiles } from "@/studios/skyforge/lib/zip-pack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const pack = await getPack(id);
  if (!pack) return Response.json({ error: "not found" }, { status: 404 });

  const texRows = await listTexturesByPack(id);
  if (!texRows.length) {
    return Response.json({ error: "テクスチャがありません" }, { status: 400 });
  }

  const pngs = texRows.map((tex) => ({
    itemId: tex.itemId,
    png: encodePng(tex.resolution, tex.resolution, tex.pixels),
    width: tex.resolution,
    height: tex.resolution,
    pixels: tex.pixels,
  }));

  const collage = composeCollage(
    pngs.map((p) => ({ pixels: p.pixels, width: p.width, height: p.height })),
    128,
  );
  const packPng = encodePng(collage.width, collage.height, collage.pixels);

  const files = buildPackFileList({
    name: pack.name,
    author: pack.author,
    description: pack.description,
    textures: pngs.map((p) => ({ itemId: p.itemId, png: p.png })),
    packPng,
  });
  const zip = await zipFiles(files);

  await bumpPackDownloads(id);

  const filename = downloadFilename(pack.name);
  return bytesResponse(zip, "application/zip", {
    "Content-Disposition": attachmentDisposition(filename),
    "Cache-Control": "no-store",
  });
}
