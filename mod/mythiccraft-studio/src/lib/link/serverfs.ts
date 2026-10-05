// Local minecraft-folder bridge (File System Access API + IndexedDB handle store).
// Lets MythicCraft read/write the live MythicMobs YAML and deploy packs
// without a backend. All file access is user-granted per origin.

export interface FSFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FSWritable>;
}
export interface FSWritable {
  write(data: string | Blob): Promise<void>;
  close(): Promise<void>;
}
export interface FSDirHandle {
  kind: string;
  name: string;
  values(): AsyncIterableIterator<FSFileHandle | FSDirHandle>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FSFileHandle>;
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<FSDirHandle>;
  queryPermission(opts?: { mode?: string }): Promise<PermissionState>;
  requestPermission(opts?: { mode?: string }): Promise<PermissionState>;
  removeEntry?(name: string, opts?: { recursive?: boolean }): Promise<void>;
}

declare global {
  interface Window {
    showDirectoryPicker?(opts?: { mode?: string }): Promise<FSDirHandle>;
  }
}

export const LINK_ROOTS = [
  "paperserver-121/plugins/MythicMobs/mobs",
  "paperserver-121/plugins/MythicMobs/items",
  "paperserver-121/plugins/MythicMobs/skills",
  "mm/life-pve-aibou/production/Items",
  "mm/life-pve-aibou/production/Skills",
  "mm/life-pve-aibou/resourcepack",
] as const;

const DB = "mythiccraft-link";
const STORE = "handles";
const KEY = "minecraft-root";

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadRootHandle(): Promise<FSDirHandle | null> {
  try {
    const db = await idb();
    const value: FSDirHandle | undefined = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).get(KEY);
      rq.onsuccess = () => resolve(rq.result as FSDirHandle | undefined);
      rq.onerror = () => reject(rq.error);
    });
    db.close();
    if (!value) return null;
    const perm = await value.queryPermission({ mode: "readwrite" }).catch(() => "denied" as PermissionState);
    if (perm !== "granted") return null;
    return value;
  } catch {
    return null;
  }
}

export async function saveRootHandle(handle: FSDirHandle) {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function clearRootHandle() {
  try {
    const db = await idb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch { /* ignore */ }
}

export async function pickRoot(): Promise<FSDirHandle> {
  if (!window.showDirectoryPicker) throw new Error("このブラウザはフォルダ選択に未対応です（Chrome / Edge 推奨）。");
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  const perm = await handle.requestPermission({ mode: "readwrite" }).catch(() => "denied" as PermissionState);
  if (perm !== "granted") throw new Error("書き込み権限が得られませんでした。");
  await saveRootHandle(handle);
  return handle;
}

async function resolveDir(root: FSDirHandle, rel: string): Promise<FSDirHandle | null> {
  try {
    let dir = root;
    for (const part of rel.split("/")) {
      dir = await dir.getDirectoryHandle(part);
    }
    return dir;
  } catch {
    return null;
  }
}

export interface TreeEntry {
  root: string;
  path: string;
  name: string;
  kind: "file" | "dir";
  size?: number;
}

export async function listRoot(root: FSDirHandle, rel: string): Promise<{ entries: TreeEntry[]; missing: boolean }> {
  const dir = await resolveDir(root, rel);
  if (!dir) return { entries: [], missing: true };
  const entries: TreeEntry[] = [];
  try {
    for await (const entry of dir.values()) {
      if (entry.kind !== "file") continue;
      const file = entry as FSFileHandle;
      let size = 0;
      try { size = (await file.getFile()).size; } catch { /* ignore */ }
      entries.push({ root: rel, path: `${rel}/${file.name}`, name: file.name, kind: "file", size });
    }
  } catch {
    return { entries, missing: true };
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return { entries, missing: false };
}

export async function readTextFile(root: FSDirHandle, relPath: string): Promise<string> {
  const parts = relPath.split("/");
  const name = parts.pop()!;
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part);
  const file = await dir.getFileHandle(name);
  return (await file.getFile()).text();
}

export async function writeTextFile(root: FSDirHandle, relPath: string, content: string): Promise<void> {
  const parts = relPath.split("/");
  const name = parts.pop()!;
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
  const file = await dir.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function writeBinaryFile(root: FSDirHandle, relPath: string, blob: Blob): Promise<void> {
  const parts = relPath.split("/");
  const name = parts.pop()!;
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
  const file = await dir.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function writeFileTree(
  root: FSDirHandle,
  baseDir: string,
  files: { path: string; content: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  let done = 0;
  for (const file of files) {
    const safe = file.path.split("/").filter((p) => p && p !== "." && p !== "..");
    await writeTextFile(root, `${baseDir}/${safe.join("/")}`, file.content);
    done++;
    onProgress?.(done, files.length);
  }
}
