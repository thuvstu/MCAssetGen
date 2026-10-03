import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxelForge — アイデアを、ブロックの世界へ。",
  description:
    "UVアトラスと形状から、Minecraftで使える3Dモデルを生成。3Dプレビュー、テクスチャマッピング、Blockbench・リソースパック書き出しに対応したクリエイティブスタジオ。",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17181f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
