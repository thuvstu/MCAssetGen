import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { emptyProject, sampleProject } from "@/lib/mod/defaults";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({ id: projects.id, name: projects.name, updatedAt: projects.updatedAt, data: projects.data })
    .from(projects)
    .orderBy(desc(projects.updatedAt));
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
  const [row] = await db.insert(projects).values({ name, data }).returning({ id: projects.id });
  return NextResponse.json({ id: row.id });
}
