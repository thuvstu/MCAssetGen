import { isPortedGui } from "@/lib/studio-components";
import "@/studios/mythicforge/studio.css";

/** 取り込んだスタジオの共通枠 (元アプリのCSSをここでだけ適用する)。 */
export default function Layout({ children }: { children: React.ReactNode }) {
  // isPortedGui は移植状況の単一情報源 (サーバー側でも読める)
  void isPortedGui;
  return (
    <div className="studio-mythicforge min-h-dvh" data-studio="mythicforge">
      {children}
    </div>
  );
}
