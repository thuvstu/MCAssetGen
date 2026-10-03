import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SkyForge | SkyBlockテクスチャパックメーカー",
    template: "%s | SkyForge",
  },
  description:
    "Hypixel SkyBlock テクスチャパックのエッセンスを混ぜ合わせ、オリジナルのピクセルテクスチャを鍛造するメーカー。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-forge font-sans text-paper antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
