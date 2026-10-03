"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: string | null;
}

/** WebGL が使えない／ランタイムで描画に失敗した場合も、編集と書き出しは続けられる */
export default class StageBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(e: unknown): State {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("stage failed", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="absolute inset-0 grid place-items-center bg-stage px-6 text-center">
        <div className="max-w-sm">
          <div className="font-mono text-[10px] tracking-[0.3em] text-vermilion">STAGE OFFLINE</div>
          <h2 className="mt-2 font-display text-[19px] text-white">ステージを描けませんでした</h2>
          <p className="mt-2 text-[11px] leading-[1.8] text-white/60">
            GPU / WebGL の制限が考えられます。左の造形・効果、右のアトラスと書き出しはそのまま使えます。
          </p>
          <details className="mt-3 text-left">
            <summary className="cursor-pointer font-mono text-[10px] text-white/40">詳細</summary>
            <pre className="mt-1 max-h-28 overflow-auto border border-white/15 bg-black/40 p-2 font-mono text-[10px] text-white/60">
              {this.state.error}
            </pre>
          </details>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-3 border border-white/25 px-3 py-1.5 text-[11px] tracking-[0.16em] text-white/80 hover:border-vermilion hover:text-white"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }
}
