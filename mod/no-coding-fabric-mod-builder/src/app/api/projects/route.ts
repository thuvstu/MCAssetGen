import { db } from "@/db";
import { projects } from "@/db/schema";
import { emptyProject, starterProject, presetProject } from "@/lib/mod/catalog";
import { desc } from "drizzle-orm";
import type { ModProject } from "@/lib/mod/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({ id: projects.id, name: projects.name, data: projects.data, updatedAt: projects.updatedAt })
    .from(projects)
    .orderBy(desc(projects.updatedAt));
  return Response.json(
    rows.map((r) => {
      const d = r.data as ModProject;
      return {
        id: r.id,
        name: r.name,
        modId: d.meta?.modId,
        updatedAt: r.updatedAt,
        counts: {
          items: d.items?.length ?? 0, blocks: d.blocks?.length ?? 0, skills: d.skills?.length ?? 0, recipes: d.recipes?.length ?? 0, mobs: d.mobs?.length ?? 0,
          structures: d.structures?.length ?? 0,
          extras: (d.effects?.length ?? 0) + (d.advancements?.length ?? 0) + (d.shops?.length ?? 0) + (d.skillPoints?.length ?? 0),
        },
      };
    }),
  );
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; template?: "empty" | "starter" | "ice" | "holy" | "ninja" | "knight" };
  const name = (body.name ?? "").trim() || "My Mod";
  const tpl = body.template ?? "starter";
  const data = tpl === "empty" ? { ...emptyProject(), meta: { ...starterProject(name).meta } } : tpl === "starter" ? starterProject(name) : presetProject(name, tpl);
  const [row] = await db.insert(projects).values({ name, data }).returning({ id: projects.id });
  return Response.json({ id: row.id }, { status: 201 });
}
