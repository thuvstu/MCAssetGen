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
