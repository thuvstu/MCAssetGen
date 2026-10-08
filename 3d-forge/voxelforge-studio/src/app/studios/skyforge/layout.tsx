import type { Metadata } from "next";
import "@/studios/skyforge/studio.css";
import { Footer } from "@/studios/skyforge/components/footer";
import { Header } from "@/studios/skyforge/components/header";

/** 元アプリのルートレイアウト (metadata + Header/Footer + body クラス) を維持。 */
export const metadata: Metadata = {
  title: {
    default: "SkyForge | SkyBlockテクスチャパックメーカー",
    template: "%s | SkyForge",
  },
  description:
    "Hypixel SkyBlock テクスチャパックのエッセンスを混ぜ合わせ、オリジナルのピクセルテクスチャを鍛造するメーカー。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="studio-skyforge bg-forge font-sans text-paper antialiased"
      data-studio="skyforge"
    >
      <Header />
      {children}
      <Footer />
    </div>
  );
}
