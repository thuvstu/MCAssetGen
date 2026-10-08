import { desc } from "drizzle-orm";
import { db } from "@/studios/mythicforge/db";
import { projects } from "@/studios/mythicforge/db/schema";
import { emptyProject, starterProject, presetProject } from "@/studios/mythicforge/lib/mod/catalog";
import { addProject, listProjectRows } from "@/studios/mythicforge/db/projects-repo";
import type { ModProject } from "@/studios/mythicforge/lib/mod/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listProjectRows();
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
          extras: (d.effects?.length ?? 0) + (d.advancements?.length ?? 0) + (d.shops?.length ?? 0) + (d.skillPoints?.length ?? 0),
        },
      };
    }),
  );
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; template?: "empty" | "starter" | "ice" | "holy" | "ninja" };
  const name = (body.name ?? "").trim() || "My Mod";
  const tpl = body.template ?? "starter";
  const data = tpl === "empty" ? { ...emptyProject(), meta: { ...starterProject(name).meta } } : tpl === "starter" ? starterProject(name) : presetProject(name, tpl);
  const id = await addProject(name, data);
  return Response.json({ id }, { status: 201 });
}
