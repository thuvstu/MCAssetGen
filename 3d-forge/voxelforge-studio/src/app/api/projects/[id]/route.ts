import { NextResponse } from "next/server";
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/studios/adv/db/projects-repo";
import { validateProjectInput } from "@/studios/adv/lib/editor/validation";

/** Advanced Weapon の単体プロジェクトAPI (元アプリと同一のパス・応答形)。 */
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = await getProject(Number(id));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const input = validateProjectInput(body);
  if (!input)
    return NextResponse.json({ error: "invalid project payload" }, { status: 400 });
  const row = await updateProject(Number(id), input);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await deleteProject(Number(id));
  return NextResponse.json({ ok: true });
}
