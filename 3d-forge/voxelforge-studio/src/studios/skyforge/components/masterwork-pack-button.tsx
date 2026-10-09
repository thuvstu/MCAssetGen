"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MASTERWORKS } from "@/studios/skyforge/lib/masterworks";

export function MasterworkPackButton({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const author = (typeof window !== "undefined" && localStorage.getItem("skyforge-author")) || "Anonymous";
      const res = await fetch("/api/studios/skyforge/masterworks/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Masterwork Collection", author }),
      });
      if (!res.ok) throw new Error(await res.text());
      const pack = (await res.json()) as { id: string };
      router.push(`/packs/${pack.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void create()}
        className={`border border-mythic/70 bg-mythic/15 px-5 py-2.5 text-sm tracking-wider text-mythic transition hover:bg-mythic/25 disabled:opacity-50 ${className}`}
      >
        {busy ? "全原画を束ねています…" : (label ?? `完成パックを今すぐ作る（${MASTERWORKS.length}点）`)}
      </button>
      {error ? <span className="text-[11px] text-ember">{error}</span> : null}
    </span>
  );
}
