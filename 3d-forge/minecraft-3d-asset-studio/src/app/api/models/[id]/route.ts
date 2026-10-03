import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { modelsTable } from "@/db/schema";
import { parsePersistedModelPayload } from "@/lib/model/modelUtils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function parseModelId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error";
}

async function getValidatedId(context: RouteContext): Promise<number | null> {
  const { id } = await context.params;
  return parseModelId(id);
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const id = await getValidatedId(context);
    if (!id) return NextResponse.json({ success: false, error: "Invalid model ID" }, { status: 400 });

    const [model] = await db.select().from(modelsTable).where(eq(modelsTable.id, id)).limit(1);
    if (!model) return NextResponse.json({ success: false, error: "Model not found" }, { status: 404 });

    return NextResponse.json({ success: true, model });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const id = await getValidatedId(context);
    if (!id) return NextResponse.json({ success: false, error: "Invalid model ID" }, { status: 400 });

    const parsed = parsePersistedModelPayload(await request.json());
    if (!parsed.data) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const [model] = await db
      .update(modelsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(modelsTable.id, id))
      .returning();

    if (!model) return NextResponse.json({ success: false, error: "Model not found" }, { status: 404 });
    return NextResponse.json({ success: true, model });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const id = await getValidatedId(context);
    if (!id) return NextResponse.json({ success: false, error: "Invalid model ID" }, { status: 400 });

    const [model] = await db.delete(modelsTable).where(eq(modelsTable.id, id)).returning({ id: modelsTable.id });
    if (!model) return NextResponse.json({ success: false, error: "Model not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Model deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}

// Kept at the original URL for compatibility with the library UI.
export async function POST(_: NextRequest, context: RouteContext) {
  try {
    const id = await getValidatedId(context);
    if (!id) return NextResponse.json({ success: false, error: "Invalid model ID" }, { status: 400 });

    const [model] = await db
      .update(modelsTable)
      .set({ likes: sql`${modelsTable.likes} + 1` })
      .where(eq(modelsTable.id, id))
      .returning({ likes: modelsTable.likes });

    if (!model) return NextResponse.json({ success: false, error: "Model not found" }, { status: 404 });
    return NextResponse.json({ success: true, likes: model.likes });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}
