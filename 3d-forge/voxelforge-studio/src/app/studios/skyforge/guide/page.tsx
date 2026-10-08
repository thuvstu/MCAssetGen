import Link from "next/link";

export const metadata = {
  title: "使い方ガイド",
};

const STEPS = [
  {
    n: "1",
    title: "スタジオでアイテムを鍛造",
    href: "/studios/skyforge/studio",
    cta: "スタジオを開く",
    body: (
      <>
        <ol className="list-decimal space-y-1 pl-5">
          <li>左のカタログからアイテムを選ぶ（剣・弓・杖・防具・道具・ペット・機械武器…87種）</li>
          <li>
            右の <b>画法</b>（どう描くか・最大2つ）と <b>系譜</b>（何の色か・最大3つ）をタップ
          </li>
          <li>中央の比較ストリップで「このアイテムが各画法でどうなるか」を即座に横並び確認</li>
          <li>「この調合で鍛造」でプレビュー更新。シード・色相・発光・カオスで微調整</li>
          <li>気に入らなければ右のピクセルエディタで直接描き直す</li>
        </ol>
      </>
    ),
  },
  {
    n: "2",
    title: "パックに保存して集める",
    href: null,
    cta: null,
    body: (
      <>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            最初に <b>パック名・作者</b> を右側の「PACK META」で入力
          </li>
          <li>「パックに保存」を毎回押す。同じアイテムは上書き、別アイテムは追加</li>
          <li>
            途中でスタイルを決めたら <b>「全N点に適用」</b> でパック全体が現在の調合に再鍛造される
          </li>
          <li>下部の「PACK CONTENTS」がそのままパックの中身（クリックで編集に戻る）</li>
        </ol>
      </>
    ),
  },
  {
    n: "3",
    title: "ZIPをダウンロードしてMinecraftへ",
    href: "/studios/skyforge/gallery",
    cta: "ギャラリー",
    body: (
      <>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            スタジオの <b>「ZIP書き出し」</b>（または <Link className="text-aqua underline" href="/studios/skyforge/gallery">ギャラリー</Link> →
            パックページ → 「リソースパック ZIP」）をタップ
          </li>
          <li>
            出てきたZIPを <code className="text-aqua">.minecraft/resourcepacks/</code> フォルダへそのまま入れる
          </li>
          <li>
            OptiFine・SkyClient 等のCIT対応クライアントで <b>オプション → リソースパック → 有効化</b>
          </li>
          <li>インベントリで Hyperion などが表示された瞬間に自分のテクスチャに差し替わる</li>
        </ol>
        <p className="mt-2 text-paper/50">
          解像度はパックごとに16 / 32 / 64から選択。64は拡大ではなく専用設計の別シルエット。
        </p>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <main className="bg-forge mx-auto min-h-screen max-w-3xl px-4 py-12">
      <p className="font-pixel text-[10px] tracking-[0.3em] text-gold">HOW TO USE</p>
      <h1 className="mt-2 font-display text-4xl text-gold-2">使い方</h1>
      <p className="mt-4 text-sm leading-relaxed text-paper/70">
        このアプリは「既存パックの画像を並べる」ものではありません。
        人気パックの<b className="text-gold-2">描き方のルール（エッセンス）</b>だけを抽出し、
        混ぜ合わせて新しいオリジナルテクスチャを生成します。流れは3ステップです。
      </p>

      <section className="mt-8 border border-mythic/40 bg-mythic/5 p-5">
        <p className="font-pixel text-[10px] tracking-widest text-mythic">FASTEST PATH</p>
        <h2 className="mt-1 font-display text-xl text-gold-2">最速：完成パックを1クリックで</h2>
        <p className="mt-2 text-sm leading-relaxed text-paper/75">
          トップまたはスタジオの「完成パックを今すぐ作る」を押すと、全82点のオリジナル64px原画（機械兵器10種を含む）が
          1つのパックとして保存され、パックページからそのままZIPをダウンロードできます。
          気に入らない1点だけを「スタジオで開く」→ ピクセル編集 → 保存、で差し替えられます。
        </p>
      </section>

      <div className="mt-8 space-y-5">
        {STEPS.map((step) => (
          <section key={step.n} className="border border-line bg-panel/70 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center border border-gold/50 bg-gold/10 font-display text-lg text-gold-2">
                {step.n}
              </span>
              <h2 className="flex-1 font-display text-xl text-gold-2">{step.title}</h2>
              {step.href ? (
                <Link
                  href={step.href}
                  className="border border-gold/60 bg-gold/10 px-3 py-1.5 text-xs text-gold-2"
                >
                  {step.cta}
                </Link>
              ) : null}
            </div>
            <div className="mt-4 text-sm leading-relaxed text-paper/75">{step.body}</div>
          </section>
        ))}
      </div>

      <section className="mt-8 border border-line bg-panel/70 p-5">
        <h2 className="font-display text-xl text-gold-2">よくある質問</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-paper/90">保存したデータはどこにある？</dt>
            <dd className="mt-1 text-paper/65">
              このサーバーのPostgreSQLに。ブラウザを閉じても消えません。
              パックページURL（/packs/…）を共有すれば他人もダウンロードできます。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-paper/90">「パックに保存」を押さなかった場合</dt>
            <dd className="mt-1 text-paper/65">
              プレビューはブラウザ内にのみ存在します。保存ボタンを押した分だけが
              ZIP書き出しの対象になります。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-paper/90">Minecraft側の要件は？</dt>
            <dd className="mt-1 text-paper/65">
              CIT対応クライアント（OptiFine / SkyClient など）。アイテム名が
              CITパターン（例 <code className="text-aqua">*Hyperion*</code>）にマッチする
              表示名付きアイテム（NEUやCITで表示される名前）が対象です。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-paper/90">64×64は16×の拡大ではないのか？</dt>
            <dd className="mt-1 text-paper/65">
              違います。全52型が64座標で別設計されており、曲線・1px刻印・別パーツ・歯車・ピストンは
              16×には存在しません。スタジオで64を選ぶと
              「TRUE NATIVE 64」バッジが出ます。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-paper/90">開発者はREADME.mdを参照</dt>
            <dd className="mt-1 text-paper/65">
              ローカルでの起動方法（npm install → drizzle push → npm run dev）、
              API一覧、アーキテクチャ図、検証スクリプトの手順はリポジトリ根の
              README.mdにまとめてあります。
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8 border border-line bg-panel/70 p-5 text-sm text-paper/60">
        <h2 className="font-display text-lg text-gold-2">権利について</h2>
        <p className="mt-2 leading-relaxed">
          生成物はプロシージャルに描画されたオリジナル画像です。
          Hypixel・SkyBlockは各権利者の商標であり、既存テクスチャパックの画像・素材は
          一切使用していません。
        </p>
      </section>
    </main>
  );
}
