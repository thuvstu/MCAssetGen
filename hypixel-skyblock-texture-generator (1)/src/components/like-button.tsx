"use client";

import { useState } from "react";

export function LikeButton({ packId, initial }: { packId: string; initial: number }) {
  const [likes, setLikes] = useState(initial);
  const [done, setDone] = useState(false);

  async function like() {
    if (done) return;
    const key = `skyforge-like-${packId}`;
    if (localStorage.getItem(key)) {
      setDone(true);
      return;
    }
    const res = await fetch(`/api/packs/${packId}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as { likes: number };
    localStorage.setItem(key, "1");
    setLikes(data.likes);
    setDone(true);
  }

  return (
    <button
      type="button"
      onClick={() => void like()}
      className="border border-line px-4 py-2 text-sm text-paper/80 hover:border-mythic/50"
    >
      ♥ {likes}
      {done ? " 済" : ""}
    </button>
  );
}
