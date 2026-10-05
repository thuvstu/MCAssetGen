import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MythicForge — ノーコードで作る Minecraft Fabric Mod",
  description: "ブロックを組み合わせてスキル・アイテム・ブロックを作り、Kotlinコードを生成・静的解析してFabric 1.21.11 Modを出力するWebアプリ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
