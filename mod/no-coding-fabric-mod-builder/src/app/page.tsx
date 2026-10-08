"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Row {
  id: string;
  name: string;
  modId?: string;
  updatedAt: string;
  counts: { items: number; blocks: number; skills: number; recipes: number; mobs?: number; structures?: number; extras?: number };
}

type Template = "starter" | "empty" | "ice" | "holy" | "ninja" | "knight";

const features = [
  { icon: "🪄", title: "ビジュアル・スキルビルダー", text: "トリガー → 条件 → アクションのブロックを積むだけ。待機・繰り返し・確率・変数・数値式 (lastDamage*0.5)・ミサイル。マナ/クールダウン/キー割り当て付き。" },
  { icon: "🌟", title: "エフェクト・実績・ショップ", text: "不死のトーテム風の復活エフェクト、進捗n/N付きの実績、村人UIの本物のショップ、/sp のスキルポイント強化。" },
  { icon: "🧱", title: "アイテム・ブロック・モブ", text: "武器/防具/道具/食料、独自素材、属性ボーナス、鉱石、カスタムモブとドロップ表、レシピ(かまど・石切台まで)。" },
  { icon: "⚒️", title: "ゲーム内で武器を鍛造", text: "武器工房の画面で見た目・素材・性能・3つの操作別スキルを選び、武器を一振りずつ作成。見た目ID・PNG・3DモデルはModに同梱して起動時に登録。" },
  { icon: "🌿", title: "ワールド生成 & 構造物", text: "鉱石・地表生成に加え、Structure Block/Viewerの.nbtインポートや初期村・鍛冶屋工房の確定生成に対応。" },
  { icon: "🔍", title: "静的解析・ロジック検証", text: "構文・import実在・未解決参照・旧API検出・循環参照・参照整合性・スキルシミュレーションをリアルタイム実行。" },
  { icon: "🛠️", title: "実コンパイル検証済み", text: "生成コードは JDK 21 + Gradle 9.6.1 + Loom 1.14 で実コンパイル。Gradle Wrapper同梱でIntelliJにそのまま読み込めます。" },
];

const presets: { key: Template; title: string; desc: string; icon: string }[] = [
  { key: "starter", title: "スターター (おすすめ)", desc: "炎の杖・ミスリル装備・鉱石・不死鳥・ショップ・実績まで全機能入り", icon: "🔥" },
  { key: "ice", title: "氷結魔道士", desc: "凍結・ブリンク・範囲吹雪の魔法系", icon: "❄️" },
  { key: "holy", title: "聖職者", desc: "回復・バリア・被弾時自動回復", icon: "✨" },
  { key: "ninja", title: "忍者", desc: "ダッシュ・手裏剣・夜間ステルス", icon: "🥷" },
  { key: "knight", title: "暗黒騎士", desc: "シールドバッシュ・処刑・報復の炎・装備セット効果", icon: "🛡️" },
  { key: "empty", title: "空のプロジェクト", desc: "何もない状態から自分で作る", icon: "📄" },
];

export default function Home() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("Mythic Skills");
  const [template, setTemplate] = useState<Template>("starter");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setRows)
      .catch(() => { setRows([]); setError("プロジェクト一覧を取得できませんでした。再読み込みしてください。"); });
  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, template }) });
      if (!r.ok) throw new Error();
      const { id } = await r.json();
      router.push(`/editor/${id}`);
    } catch {
      setError("プロジェクトを作成できませんでした。");
      setBusy(false);
    }
  };

  const importJson = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const parsed = JSON.parse(await file.text()) as { name?: string; data?: { meta?: { modId?: string; name?: string } } };
      const data = (parsed.data ?? parsed) as { meta?: { modId?: string; name?: string } };
      if (!data?.meta?.modId) throw new Error("invalid");
      const title = parsed.name ?? data.meta.name ?? "Imported";
      const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: title, template: "empty" }) });
      const { id } = await r.json();
      await fetch(`/api/projects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: title, data }) });
      router.push(`/editor/${id}`);
    } catch {
      setError("MythicForge の JSON ファイルを読み込めませんでした。");
      setBusy(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか? この操作は元に戻せません。`)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="grid-bg relative min-h-screen">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0c0f14_0%,rgba(12,15,20,0.9)_42%,rgba(12,15,20,0.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[#0c0f14]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500 text-xl text-black">⛏</span>
          <span className="text-xl font-bold tracking-tight">MythicForge</span>
          <span className="ml-2 rounded-full border border-emerald-500/30 px-2 py-0.5 font-code text-[11px] text-emerald-300">MC 1.21.11 · Fabric · Kotlin</span>
          <nav className="ml-auto flex gap-4 text-sm text-slate-300">
            <Link href="/docs" className="hover:text-emerald-300">ドキュメント</Link>
          </nav>
        </header>
        <h1 className="mt-10 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
          コードを書かずに作る、<span className="text-emerald-400">スキルとRPG要素付き</span> Minecraft Fabric Mod
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          ブロックを積んでスキルを設計し、アイテム・モブ・実績・ショップを追加。裏で Kotlin コードが生成され、ブラウザ上で静的解析・検証されます。ZIP を出力すれば IntelliJ でそのままビルドできます。
        </p>

        {error && <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-[#262f3e] bg-[#141922] p-5">
            <h2 className="font-semibold">新しいModプロジェクト</h2>
            <label htmlFor="mod-name" className="mt-4 block text-xs text-slate-400">Mod名</label>
            <input id="mod-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="mt-1 w-full rounded-md border border-[#262f3e] bg-[#0c0f14] px-3 py-2 text-sm outline-none focus:border-emerald-400/70" />
            <div className="mt-4 grid gap-2">
              {presets.map((k) => (
                <button key={k.key} onClick={() => setTemplate(k.key)} aria-pressed={template === k.key} className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${template === k.key ? "border-emerald-400/60 bg-emerald-500/10" : "border-[#262f3e] hover:bg-white/5"}`}>
                  <span className="text-xl">{k.icon}</span>
                  <span>
                    <span className="block text-sm font-semibold">{k.title}</span>
                    <span className="block text-[11px] text-slate-400">{k.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <button onClick={create} disabled={busy || !name.trim()} className="mt-5 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50">
              {busy ? "処理中…" : "プロジェクトを作成"}
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="mt-2 w-full rounded-lg border border-[#2b3547] py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50">⬆ JSON から読み込む</button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
          </section>

          <section className="rounded-2xl border border-[#262f3e] bg-[#141922] p-5">
            <h2 className="font-semibold">プロジェクト</h2>
            {rows === null && <p className="mt-4 text-sm text-slate-500">読み込み中…</p>}
            {rows?.length === 0 && <p className="mt-4 text-sm text-slate-500">まだプロジェクトがありません。左のフォームから作成しましょう。</p>}
            <div className="mt-3 space-y-2">
              {rows?.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-[#262f3e] bg-[#0c0f14] p-3">
                  <Link href={`/editor/${r.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-100 hover:text-emerald-300">{r.name}</p>
                    <p className="font-code text-[11px] text-slate-500">
                      {r.modId} · スキル{r.counts.skills} / アイテム{r.counts.items} / 構造物{r.counts.structures ?? 0} / 拡張{r.counts.extras ?? 0}
                    </p>
                  </Link>
                  <span className="hidden text-[11px] text-slate-500 sm:block">{new Date(r.updatedAt).toLocaleString("ja-JP")}</span>
                  <Link href={`/editor/${r.id}`} className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/25">開く</Link>
                  <button onClick={() => remove(r.id, r.name)} className="rounded-md px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/10">削除</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-[#262f3e] bg-[#141922]/80 p-4">
              <p className="text-2xl">{f.icon}</p>
              <p className="mt-2 text-sm font-semibold">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
        <footer className="mt-12 border-t border-[#262f3e] pt-6 text-center text-xs text-slate-500">
          MythicForge · 生成コードは Minecraft 1.21.11 (Mojang公式マッピング) / Fabric / Kotlin 向け · <Link href="/docs" className="text-emerald-300 hover:underline">ドキュメント</Link>
        </footer>
      </div>
    </div>
  );
}
