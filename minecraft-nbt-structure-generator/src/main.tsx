import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="flex min-h-screen items-center justify-center bg-[#070b09] p-6 text-zinc-200">
          <div className="w-full max-w-md rounded-2xl border border-red-900/60 bg-zinc-950 p-6 text-center shadow-2xl">
            <div className="text-base font-black text-white">予期しないエラーが発生しました</div>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
              作業内容はこのブラウザに自動保存されています。再読み込みすると直前の状態から復元されます。
            </p>
            <pre className="mt-3 max-h-32 overflow-auto rounded-md bg-black p-2 text-left font-mono text-[10px] text-red-300">{error.message}</pre>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={reset} className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-[12px] font-bold text-zinc-200 hover:bg-zinc-800">
                再試行
              </button>
              <button onClick={() => location.reload()} className="rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-emerald-500">
                再読み込み
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);
