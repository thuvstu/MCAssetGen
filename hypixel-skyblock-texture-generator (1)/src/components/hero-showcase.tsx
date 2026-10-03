"use client";

import Link from "next/link";
import { MASTERWORKS } from "@/lib/masterworks";

/**
 * The hero shows actual editable original masterworks, rather than low-detail
 * generated thumbnails. Clicking one opens Studio, where the exact 64px RGBA
 * art can be loaded, edited, saved and packed.
 */
export function HeroShowcase() {
  return (
    <div className="relative mx-auto mt-10 max-w-3xl">
      <p className="mb-3 text-center font-pixel text-[10px] tracking-[0.22em] text-mythic">
        ORIGINAL MASTERWORK FOUNDATIONS · {MASTERWORKS.length} PIECES · CLICK TO FORGE
      </p>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-12">
        {MASTERWORKS.slice(0, 12).map((masterwork, i) => (
          <Link
            key={masterwork.itemId}
            href={`/studio?masterwork=${masterwork.itemId}`}
            className="floaty slot-item group grid aspect-square place-items-center overflow-hidden border border-mythic/20 transition hover:border-mythic/80 hover:bg-mythic/10"
            style={{ animationDelay: `${i * 0.12}s` }}
            title={`${masterwork.titleJa} をスタジオで開く`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={masterwork.file}
              alt={masterwork.titleJa}
              className="pixelated h-full w-full object-contain p-1 transition duration-300 group-hover:scale-110"
            />
          </Link>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-paper/50">
        原画を起点にするか、画法 × 系譜から一から鍛造するかを選べます。
      </p>
    </div>
  );
}
