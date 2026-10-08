"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { isPortedGui } from "@/lib/studio-components";

/**
 * 取り込んだスタジオの読み込み表。
 *
 * 元アプリのコンポーネントはブラウザAPI (canvas / File / ImageData) を
 * 前提にしているため `ssr: false` でクライアント側だけ描画する。
 * ここを増やすだけでスタジオが1つずつ統合される (ロジックは原本のまま)。
 */
const STUDIO_COMPONENTS: Record<string, ComponentType> = {
  texcraft: dynamic(() => import("@/studios/texcraft/App"), { ssr: false }),
  sword: dynamic(() => import("@/studios/sword/App"), { ssr: false }),
  spell: dynamic(() => import("@/studios/spell/App"), { ssr: false }),
  arcane: dynamic(() => import("@/studios/arcane/App"), { ssr: false }),
  mob: dynamic(() => import("@/studios/mob/App"), { ssr: false }),
  armor: dynamic(() => import("@/studios/armor/App"), { ssr: false }),
  material: dynamic(() => import("@/studios/material/App"), { ssr: false }),
  structure: dynamic(() => import("@/studios/structure/Entry"), { ssr: false }),
  sky2: dynamic(() => import("@/studios/sky2/App"), { ssr: false }),
  adv: dynamic(() => import("@/studios/adv/App"), { ssr: false }),
};

export default function StudioHost({ id }: { id: string }) {
  const Studio = isPortedGui(id) ? STUDIO_COMPONENTS[id] : undefined;
  if (!Studio) {
    return (
      <div className="flex min-h-screen items-center justify-center p-10">
        <p className="text-sm">
          このスタジオのGUIはまだ取り込み中です。エンジンは API/CLI から利用できます
          (エンジンコンソール:{" "}
          <a className="underline" href="/engines">
            /engines
          </a>
          )。
        </p>
      </div>
    );
  }
  // 見た目は元アプリのCSSをスコープしたクラス配下でのみ適用する
  return (
    <div className={`studio-${id} min-h-screen`} data-studio={id}>
      <Studio />
    </div>
  );
}
