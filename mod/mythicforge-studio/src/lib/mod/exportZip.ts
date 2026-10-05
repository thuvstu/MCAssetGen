import type { GeneratedFile } from "./types";

export async function downloadZip(name: string, files: GeneratedFile[]) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  files.forEach((f) =>
    zip.file(f.path, f.content, {
      base64: f.encoding === "base64",
      ...(f.executable ? { unixPermissions: 0o755 } : {}),
    }),
  );
  const blob = await zip.generateAsync({ type: "blob", platform: "UNIX" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
