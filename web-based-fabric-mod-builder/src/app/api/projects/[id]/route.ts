import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not found" }, { status: 404 });
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ id: row.id, name: row.name, data: row.data, updatedAt: row.updatedAt });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not found" }, { status: 404 });
  const body = (await req.json()) as { name?: string; data?: unknown };
  if (!body.data || typeof body.data !== "object") return Response.json({ error: "data required" }, { status: 400 });
  const name = (body.name ?? "").trim() || "Untitled";
  await db.update(projects).set({ name, data: body.data, updatedAt: new Date() }).where(eq(projects.id, id));
  return Response.json({ ok: true, updatedAt: new Date().toISOString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "not found" }, { status: 404 });
  await db.delete(projects).where(eq(projects.id, id));
  return Response.json({ ok: true });
}
