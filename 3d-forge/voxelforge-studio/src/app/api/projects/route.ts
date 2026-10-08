import { NextResponse } from "next/server";
import { insertProject, listProjects } from "@/studios/adv/db/projects-repo";
import { validateProjectInput } from "@/studios/adv/lib/editor/validation";

/**
 * Advanced Weapon スタジオのプロジェクトAPI。
 * 元アプリと同じパス (/api/projects)・同じ応答形を保つため、
 * UI側の fetch はそのまま動く (移植はパス維持)。
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listProjects();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const input = validateProjectInput(body);
  if (!input)
    return NextResponse.json({ error: "invalid project payload" }, { status: 400 });
  const row = await insertProject(input);
  return NextResponse.json(row, { status: 201 });
}
