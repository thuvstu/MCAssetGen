import ProjectList from "@/components/ProjectList";

export default function HomePage() {
  return (
    <main className="pixel-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-xs text-emerald-300">
            Minecraft 1.21.1 · Fabric · Kotlin
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-emerald-400">Mythic</span>Craft Studio
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-400">
            MythicMobs のようなスキルシステム（メカニック・ターゲッター・条件・トリガー）と MCreator のようなビジュアル編集で、
            コーディング不要の Fabric Mod を作成。Kotlin コードを自動生成し、ロジック検証・静的解析（構文/インポート/API誤用）を行い、
            そのままビルド可能な Gradle プロジェクトを ZIP で出力します。
          </p>
          <div className="mt-6 grid gap-3 text-sm md:grid-cols-5">
            {[
              ["⚔️ スキル", "38種のメカニック・12種のターゲッター・20種の条件・永続変数・弾道スキル"],
              ["👹 モブ/要素", "カスタムモブ / 武器・防具・食料 / 鉱石+自然生成 / レシピ / コマンド"],
              ["🔄 互換", "MythicMobs YAML のインポート・エクスポート"],
              ["🔍 解析", "モデル検証 + Kotlin字句解析・import解決・1.21.1 API Lint"],
              ["📦 出力", "Gradle(Kotlin DSL) + GitHub Actions ビルド同梱 ZIP"],
            ].map(([t, d]) => (
              <div key={t} className="card p-4">
                <div className="font-semibold">{t}</div>
                <div className="mt-1 text-xs text-zinc-400">{d}</div>
              </div>
            ))}
          </div>
        </header>
        <ProjectList />
      </div>
    </main>
  );
}
