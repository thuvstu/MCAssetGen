"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderOpen, Heart, Search, Trash2, X } from "lucide-react";
import { ModelCategory } from "@/types/model";

interface LibraryModel {
  id: number;
  name: string;
  description: string | null;
  category: ModelCategory | string;
  theme: string;
  textureResolution: number;
  modelData: unknown;
  textureDataUrl: string;
  isPreset: boolean;
  likes: number;
}

interface ModelListResponse {
  success: boolean;
  models?: LibraryModel[];
  error?: string;
}

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadModel: (modelData: unknown, textureUrl: string) => void;
}

const LIBRARY_FILTERS: ReadonlyArray<{ id: "all" | ModelCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "sword", label: "Swords & Scythes" },
  { id: "staff", label: "Staves & Wands" },
  { id: "armor", label: "Armors" },
  { id: "magic", label: "魔導書" },
  { id: "ranged", label: "射撃/銃" },
  { id: "relic", label: "レリック" },
];

export function PresetsModal({ isOpen, onClose, onLoadModel }: PresetsModalProps) {
  const [models, setModels] = useState<LibraryModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | ModelCategory>("all");

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/models?category=${encodeURIComponent(category)}`);
      const payload: ModelListResponse = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not load the model library.");
      setModels(payload.models || []);
    } catch (caughtError) {
      console.error("Loading model library failed", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "Could not load the model library.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (isOpen) void fetchModels();
  }, [fetchModels, isOpen]);

  const filteredModels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return models;
    return models.filter((model) => [model.name, model.description, model.theme, model.category].some((value) => value?.toLowerCase().includes(query)));
  }, [models, search]);

  const handleLike = async (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      const response = await fetch(`/api/models/${id}`, { method: "POST" });
      const payload: { success?: boolean; likes?: number } = await response.json();
      if (!response.ok || !payload.success || typeof payload.likes !== "number") return;
      setModels((current) => current.map((model) => (model.id === id ? { ...model, likes: payload.likes! } : model)));
    } catch (caughtError) {
      console.error("Liking model failed", caughtError);
    }
  };

  const handleDelete = async (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!window.confirm("Delete this saved model?")) return;
    try {
      const response = await fetch(`/api/models/${id}`, { method: "DELETE" });
      const payload: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not delete the model.");
      setModels((current) => current.filter((model) => model.id !== id));
    } catch (caughtError) {
      console.error("Deleting model failed", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "Could not delete the model.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <section className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#2d3139] bg-[#181a22] text-neutral-200 shadow-2xl" role="dialog" aria-modal="true" aria-label="Model library">
        <header className="flex items-center justify-between border-b border-[#2d3139] bg-[#1e212b] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-600/20 text-blue-400"><FolderOpen className="h-4 w-4" /></div>
            <div><h2 className="text-base font-bold text-white">Model Library & Presets</h2><p className="text-xs text-neutral-400">Browse pre-built Minecraft weapon templates and your saved creations.</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-[#282d3b] hover:text-white" aria-label="Close library"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex flex-col items-center justify-between gap-3 border-b border-[#2d3139] bg-[#14161d] px-5 py-3 sm:flex-row">
          <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" /><input type="search" placeholder="Search models..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-[#2d3139] bg-[#1b1e27] py-1.5 pl-8 pr-3 text-xs text-neutral-200 outline-none focus:border-blue-500" /></div>
          <div className="flex w-full items-center gap-1 overflow-x-auto sm:w-auto">
            {LIBRARY_FILTERS.map((filter) => <button key={filter.id} onClick={() => setCategory(filter.id)} className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition ${category === filter.id ? "bg-blue-600 font-semibold text-white" : "bg-[#1f232d] text-neutral-400 hover:text-neutral-200"}`}>{filter.label}</button>)}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading && <div className="py-16 text-center text-xs text-neutral-400">Loading models…</div>}
          {!loading && error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</div>}
          {!loading && !error && filteredModels.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-neutral-500"><FolderOpen className="mb-2 h-10 w-10 opacity-40" /><p className="text-xs">No models found</p></div>}
          {!loading && !error && filteredModels.length > 0 && <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModels.map((item) => {
              const elementCount = item.modelData && typeof item.modelData === "object" && Array.isArray((item.modelData as { elements?: unknown }).elements) ? (item.modelData as { elements: unknown[] }).elements.length : 0;
              return <article key={item.id} onClick={() => { onLoadModel(item.modelData, item.textureDataUrl); onClose(); }} className="group relative flex cursor-pointer flex-col rounded-xl border border-[#2c313d] bg-[#1c1f29] p-3.5 shadow-md transition hover:border-blue-500/60 hover:bg-[#222735]">
                <div className="mb-2 flex items-start justify-between gap-2"><div className="truncate"><span className="block truncate text-sm font-bold text-white transition group-hover:text-blue-400">{item.name}</span><div className="mt-0.5 flex items-center gap-1.5"><span className="rounded bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-300">{item.category}</span><span className="rounded bg-purple-600/20 px-1.5 py-0.5 text-[10px] font-medium capitalize text-purple-300">{item.theme}</span><span className="rounded bg-emerald-600/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">{item.textureResolution}px</span></div></div><button onClick={(event) => void handleLike(item.id, event)} className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400 hover:text-rose-300" title="Like"><Heart className="h-3 w-3 fill-rose-500 text-rose-500" />{item.likes}</button></div>
                <p className="mb-3 line-clamp-2 text-xs text-neutral-400">{item.description || "Custom Minecraft 3D box model"}</p>
                <div className="mt-auto flex items-center justify-between border-t border-[#2a2f3a] pt-2 text-[11px] text-neutral-400"><span>{elementCount} Cubes</span><div className="flex items-center gap-1.5">{!item.isPreset && <button onClick={(event) => void handleDelete(item.id, event)} className="p-1 text-neutral-500 transition hover:text-red-400" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>}<span className="text-xs font-semibold text-blue-400 group-hover:underline">Open →</span></div></div>
              </article>;
            })}
          </div>}
        </div>
        <footer className="flex justify-end border-t border-[#2d3139] bg-[#1a1d26] px-5 py-3"><button onClick={onClose} className="rounded-lg bg-[#282d3b] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#343a4c]">Close</button></footer>
      </section>
    </div>
  );
}
