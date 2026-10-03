import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import {
  isPayloadTooLarge,
  jsonError,
  publicErrorMessage,
  readJsonBody,
} from "@/lib/http";
import { generateModel, validateSettings } from "@/lib/model-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LIBRARY_LIMIT = 40;

export async function GET() {
  try {
    const data = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.updatedAt))
      .limit(LIBRARY_LIMIT);
    return Response.json({ projects: data });
  } catch (error) {
    console.error("Load models:", error);
    return jsonError(
      "モデル一覧を取得できませんでした。再読み込みしてください。",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const settings = validateSettings(body.settings);
    const model = generateModel(settings);

    if (body.persist === false) return Response.json({ model });

    const [project] = await db
      .insert(projects)
      .values({ name: settings.name, kind: settings.kind, settings, model })
      .returning();
    return Response.json({ model, project }, { status: 201 });
  } catch (error) {
    if (isPayloadTooLarge(error)) return jsonError(error.message, 413);
    console.error("Generate model:", error);
    return jsonError(
      publicErrorMessage(
        error,
        "保存できませんでした。しばらくしてから再試行してください。",
      ),
      400,
    );
  }
}
