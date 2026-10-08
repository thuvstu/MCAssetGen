import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // Ported generator sources (see MERGE_PLAN.md) are plain TypeScript engines,
    // not React components — the Next.js hook rules do not apply to them.
    files: [
      "src/lib/compat/**/*.{ts,tsx}",
      "src/lib/export/geckolib.ts",
      // 元スタジオから引き継いだGUIの hooks / viewport (挙動を変えずに保持)
      "src/components/studio/**/*.{ts,tsx}",
      "src/components/viewport/**/*.{ts,tsx}",
    ],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
  {
    // `src/studios/**` は各スタジオのGUIを取り込んだもの。元アプリのコードを
    // 一字も変えずに保持する方針 (機能差ゼロ) なので、React Compiler 系の
    // 新しいlint規則 (refs / purity / immutability など) はここでは適用しない。
    // 統合側のコード (src/app, src/components, src/lib) には通常どおり適用される。
    files: ["src/studios/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
]);
