import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** エラー時に表示する内容。reset() で再描画を試みる */
  fallback: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 描画中の例外を捕捉して、アプリ全体が白画面になるのを防ぐ。
 * 3Dビュー（WebGL）や予期しないデータでの落ち方に備える。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Minecraft Asset Maker]", error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset);
    return this.props.children;
  }
}
