/**
 * 開発サーバー設定。
 *
 * プレビューは `https://<port>-<sandbox>.e2b.app` のような別オリジンから
 * プロキシされるため、Next.js 16 の dev リソース保護 (HMR / クライアント
 * チャンク) に引っかかると「画面は出るが操作できない」状態になる。
 * ここで許可ホストを明示する。
 */
import type { NextConfig } from "next";

const devOrigins = [
  "localhost",
  "127.0.0.1",
  "*.e2b.app",
  "*.e2b.dev",
  "*.e2b-staging.app",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
