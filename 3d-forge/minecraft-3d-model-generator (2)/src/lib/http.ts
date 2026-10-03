import { MAX_REQUEST_CHARS, ValidationError } from "./settings-schema";

/** Matches driver/database noise that must never reach the client. */
const INTERNAL_ERROR_PATTERN = /query|relation|connect|database/i;

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export class PayloadTooLargeError extends Error {}

/** Reads a size-capped JSON body. */
export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > MAX_REQUEST_CHARS)
    throw new PayloadTooLargeError("ファイルサイズが大きすぎます。");
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new ValidationError("リクエストの形式が正しくありません。");
    return value as Record<string, unknown>;
  } catch {
    throw new ValidationError("リクエストの形式が正しくありません。");
  }
}

/** Surfaces safe messages only; internal failures fall back to `fallback`. */
export function publicErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof Error && !INTERNAL_ERROR_PATTERN.test(error.message))
    return error.message;
  return fallback;
}

export function isPayloadTooLarge(
  error: unknown,
): error is PayloadTooLargeError {
  return error instanceof PayloadTooLargeError;
}
