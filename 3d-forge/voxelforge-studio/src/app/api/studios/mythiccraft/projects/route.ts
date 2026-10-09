import { NextResponse } from "next/server";
import { emptyProject, sampleProject } from "@/studios/mythiccraft/lib/mod/defaults";
import { addProject, listProjectRows } from "@/studios/mythiccraft/db/projects-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listProjectRows();
  return NextResponse.json(
    rows.map((r) => {
      const d = r.data as { items?: unknown[]; blocks?: unknown[]; skills?: unknown[]; meta?: { modId?: string } };
      return {
        id: r.id,
        name: r.name,
        updatedAt: r.updatedAt,
        modId: d.meta?.modId ?? "",
        counts: { items: d.items?.length ?? 0, blocks: d.blocks?.length ?? 0, skills: d.skills?.length ?? 0 },
      };
    }),
  );
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; template?: string };
  const name = (body.name ?? "").trim() || "My Skill Mod";
  const data = body.template === "sample" ? sampleProject(name) : emptyProject(name);
  const id = await addProject(name, data);
  return NextResponse.json({ id });
}
