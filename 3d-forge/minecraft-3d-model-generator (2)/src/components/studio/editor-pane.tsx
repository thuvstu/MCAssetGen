"use client";

import { useRef } from "react";
import { Box, ShieldCheck } from "lucide-react";
import PreviewCard from "./preview-card";
import TexturePanel from "./texture-panel";

export default function EditorPane() {
  const atlasInput = useRef<HTMLInputElement>(null);
  const openAtlasPicker = () => atlasInput.current?.click();

  return (
    <main className="editor-pane">
      <div className="editor-heading">
        <div>
          <div className="heading-kicker">
            <span />
            CREATE SOMETHING EXTRAORDINARY
          </div>
          <h1>
            モデルスタジオ<span className="heading-period">.</span>
          </h1>
          <p>アイデアを、ブロックの世界へ。</p>
        </div>
        <span className="minecraft-ready">
          <Box size={12} />
          <span>Minecraft ready</span>
        </span>
      </div>

      <PreviewCard onOpenAtlasPicker={openAtlasPicker} />
      <TexturePanel inputRef={atlasInput} onOpenAtlasPicker={openAtlasPicker} />

      <div className="editor-bottom-note">
        <ShieldCheck size={12} />
        <span>
          あなたのアイデアは、あなたのもの。生成したモデルは自由に使えます。
        </span>
        <span className="editor-bottom-shortcut">
          <kbd>⌘</kbd>
          <kbd>↵</kbd>で生成
        </span>
      </div>
    </main>
  );
}
