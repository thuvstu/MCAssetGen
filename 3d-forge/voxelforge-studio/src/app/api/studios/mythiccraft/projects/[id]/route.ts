import { NextResponse } from "next/server";
import type { ModProject } from "@/studios/mythiccraft/lib/mod/types";
import { findProject, patchProject, removeProject } from "@/studios/mythiccraft/db/projects-repo";

export const dynamic = "force-dynamic";

function parseId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const row = await findProject(id);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id: row.id, name: row.name, data: row.data, updatedAt: row.updatedAt });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = (await req.json().catch(() => null)) as { data?: ModProject } | null;
  if (!body?.data?.meta) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const row = await patchProject(id, { data: body.data, name: body.data.meta.name || "Untitled" });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id: row.id, updatedAt: row.updatedAt });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await removeProject(id);
  return NextResponse.json({ ok: true });
}
