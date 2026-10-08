export function bytesResponse(
  data: Uint8Array,
  contentType: string,
  headers?: Record<string, string>,
): Response {
  const blob = new Blob([data as unknown as BlobPart], { type: contentType });
  return new Response(blob, {
    headers: {
      "Content-Type": contentType,
      ...(headers ?? {}),
    },
  });
}

/**
 * ダウンロード用 Content-Disposition。
 *
 * HTTPヘッダはLatin-1しか運べないため、日本語などのパック名をそのまま入れると
 * ByteString 変換で例外になる。ASCII フォールバック + RFC 5987 の
 * `filename*=UTF-8''...` を併記して、どの名前でも安全に落とせるようにする。
 */
export function attachmentDisposition(filename: string, fallback = "skyforge-pack.zip"): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "").trim();
  const ext = ascii.match(/\.[A-Za-z0-9]+$/)?.[0] ?? "";
  const stem = ascii.slice(0, ascii.length - ext.length);
  const safe = /[A-Za-z0-9]/.test(stem) ? ascii : fallback;
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
