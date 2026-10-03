import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxelForge — タグから、あなただけの3Dモデルを。",
  description: "タグを組み合わせてボクセル3Dモデルを生成。Minecraft Java用JSON、Blockbenchプロジェクト、テクスチャ付きZIPで書き出せる無料のモデル制作ツール。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ja"><body>{children}</body></html>;
}
