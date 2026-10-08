import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizeProject } from "@/lib/mod/catalog";
import type { ModProject } from "@/lib/mod/model";

export const dynamic = "force-dynamic";

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not found" }, { status: 404 });
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  // 旧バージョンで保存された行にも新フィールド(forge/structures等)を補完して返す
  const data = normalizeProject(row.data as Partial<ModProject>);
  return Response.json({ id: row.id, name: row.name, data, updatedAt: row.updatedAt });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not found" }, { status: 404 });
  const body = (await req.json()) as { name?: string; data?: unknown };
  if (!body.data || typeof body.data !== "object") return Response.json({ error: "data required" }, { status: 400 });
  const name = (body.name ?? "").trim() || "Untitled";
  const data = normalizeProject(body.data as Partial<ModProject>);
  await db.update(projects).set({ name, data, updatedAt: new Date() }).where(eq(projects.id, id));
  return Response.json({ ok: true, updatedAt: new Date().toISOString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not found" }, { status: 404 });
  await db.delete(projects).where(eq(projects.id, id));
  return Response.json({ ok: true });
}
