import type { ModMeta } from "./types";

export type MappingKind = "mojmap" | "yarn";
export type ProfileId = "mc1_21_11_mojmap" | "mc1_21_1_yarn";

/** 生成する Gradle プロジェクトのビルド環境 (Minecraft / Loom / Gradle / マッピング …) */
export interface TargetEnv {
  profile: ProfileId;
  minecraft: string;
  mappings: MappingKind;
  /** Yarn を使う場合のみ (例: 1.21.1+build.3) */
  yarn: string;
  /** Loom の Gradle プラグイン ID */
  loomPlugin: string;
  loom: string;
  gradle: string;
  loader: string;
  fabricApi: string;
  /** Fabric Language Kotlin (例: 1.13.10+kotlin.2.3.20) */
  kotlinLoader: string;
  /** Kotlin Gradle プラグイン (FLK の +kotlin.X と一致させる) */
  kotlin: string;
  java: number;
}

export interface ProfileInfo {
  id: ProfileId;
  label: string;
  note: string;
  env: TargetEnv;
  /** 実コンパイルで検証済みの構成 */
  verified: string;
}

export const PROFILES: Record<ProfileId, ProfileInfo> = {
  mc1_21_11_mojmap: {
    id: "mc1_21_11_mojmap",
    label: "Minecraft 1.21.11 / Mojang マッピング / Loom 1.14 (推奨)",
    note: "難読化ありの最後のバージョン。Yarn 名を使わず Mojang 公式名でコードを生成します。",
    verified: "JDK 21 + Gradle 9.6.1 + Loom 1.14-SNAPSHOT で実コンパイル",
    env: {
      profile: "mc1_21_11_mojmap",
      minecraft: "1.21.11",
      mappings: "mojmap",
      yarn: "",
      loomPlugin: "net.fabricmc.fabric-loom-remap",
      loom: "1.14-SNAPSHOT",
      gradle: "9.6.1",
      loader: "0.19.5",
      fabricApi: "0.141.6+1.21.11",
      kotlinLoader: "1.13.10+kotlin.2.3.20",
      kotlin: "2.3.20",
      java: 21,
    },
  },
  mc1_21_1_yarn: {
    id: "mc1_21_1_yarn",
    label: "Minecraft 1.21.1 / Yarn マッピング / Loom 1.7 (旧)",
    note: "従来の生成先。既存プロジェクトの互換用です。",
    verified: "JDK 21 + Gradle 8.10.2 + Loom 1.7.4 で実コンパイル",
    env: {
      profile: "mc1_21_1_yarn",
      minecraft: "1.21.1",
      mappings: "yarn",
      yarn: "1.21.1+build.3",
      loomPlugin: "fabric-loom",
      loom: "1.7.4",
      gradle: "8.10.2",
      loader: "0.16.5",
      fabricApi: "0.105.0+1.21.1",
      kotlinLoader: "1.12.1+kotlin.2.0.20",
      kotlin: "2.0.20",
      java: 21,
    },
  },
};

export const DEFAULT_PROFILE: ProfileId = "mc1_21_11_mojmap";
/** env が未保存の古いプロジェクトは従来どおり 1.21.1 / Yarn として扱う */
export const LEGACY_PROFILE: ProfileId = "mc1_21_1_yarn";

export function resolveEnv(meta: Pick<ModMeta, "env"> | undefined): TargetEnv {
  const id = meta?.env?.profile && PROFILES[meta.env.profile] ? meta.env.profile : LEGACY_PROFILE;
  return { ...PROFILES[id].env, ...(meta?.env ?? {}), profile: id };
}

export interface EnvIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

const verOf = (s: string) => s.split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
export function cmpVer(a: string, b: string): number {
  const x = verOf(a);
  const y = verOf(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** ビルド環境の整合性チェック (Loom/Gradle/マッピング/Kotlin の組み合わせ) */
export function checkEnv(env: TargetEnv): EnvIssue[] {
  const out: EnvIssue[] = [];
  const add = (severity: EnvIssue["severity"], code: string, message: string) => out.push({ severity, code, message });
  const loomNum = env.loom.replace(/-SNAPSHOT$/, "");

  if (env.java < 21) add("error", "ENV-JAVA", "Minecraft 1.20.5 以降は Java 21 以上が必要です");
  if (!/^\d+\.\d+(\.\d+)?$/.test(env.minecraft)) add("error", "ENV-MC", `Minecraft バージョン '${env.minecraft}' の形式が不正です`);

  // マッピング
  if (env.mappings === "yarn" && !env.yarn.trim()) add("error", "ENV-YARN", "Yarn マッピングのバージョンが未設定です (例: 1.21.1+build.3)");
  if (env.mappings === "yarn" && env.yarn.trim() && !env.yarn.startsWith(env.minecraft)) add("error", "ENV-YARN", `Yarn '${env.yarn}' が Minecraft ${env.minecraft} 用ではありません`);
  if (env.mappings === "mojmap" && env.yarn.trim()) add("info", "ENV-YARN", "Mojang マッピングでは Yarn の指定は使われません (Yarn 名と混ぜないでください)");

  // Loom プラグイン ID
  if (!/^(fabric-loom|net\.fabricmc\.fabric-loom(-remap)?)$/.test(env.loomPlugin)) add("error", "ENV-LOOM-ID", `不明な Loom プラグイン ID '${env.loomPlugin}'`);
  else {
    if (cmpVer(loomNum, "1.14") >= 0 && env.loomPlugin === "fabric-loom")
      add("warning", "ENV-LOOM-ID", "Loom 1.14 以降はリマップ版のプラグイン ID `net.fabricmc.fabric-loom-remap` を推奨します (`fabric-loom` は旧名)");
    if (cmpVer(loomNum, "1.14") < 0 && env.loomPlugin === "net.fabricmc.fabric-loom-remap")
      add("error", "ENV-LOOM-ID", `Loom ${env.loom} には \`net.fabricmc.fabric-loom-remap\` が存在しません。Loom 1.14 以上にするか \`fabric-loom\` を使ってください`);
    if (env.loomPlugin === "net.fabricmc.fabric-loom" && cmpVer(env.minecraft, "26.1") < 0)
      add("error", "ENV-LOOM-ID", "`net.fabricmc.fabric-loom` (非難読化モード) は Minecraft 26.1 以降専用です。1.21.x では `-remap` 版を使ってください");
  }

  // Loom ↔ Gradle
  const needGradle = cmpVer(loomNum, "1.14") >= 0 ? "9.5" : cmpVer(loomNum, "1.11") >= 0 ? "8.14" : cmpVer(loomNum, "1.10") >= 0 ? "8.12" : "8.7";
  if (cmpVer(env.gradle, needGradle) < 0) add("error", "ENV-GRADLE", `Loom ${env.loom} には Gradle ${needGradle} 以上が必要です (現在 ${env.gradle})`);
  if (cmpVer(env.gradle, "9.0") >= 0 && cmpVer(env.kotlin, "2.2") < 0)
    add("warning", "ENV-KOTLIN", `Gradle ${env.gradle} には Kotlin Gradle プラグイン 2.2 以上を推奨します (現在 ${env.kotlin})`);

  // Kotlin ↔ FLK
  const flkKotlin = /\+kotlin\.([0-9.]+)/.exec(env.kotlinLoader)?.[1];
  if (!flkKotlin) add("error", "ENV-FLK", `Fabric Language Kotlin '${env.kotlinLoader}' の形式が不正です (例: 1.13.10+kotlin.2.3.20)`);
  else if (flkKotlin !== env.kotlin) add("warning", "ENV-FLK", `Kotlin プラグイン ${env.kotlin} と FLK が同梱する Kotlin ${flkKotlin} が一致していません。不一致だと実行時に NoSuchMethodError になることがあります`);
  if (cmpVer(env.kotlin, "2.0") < 0) add("error", "ENV-KOTLIN", "Loom は Kotlin 2.0 以上が必要です");

  // Fabric API / Loader
  if (!env.fabricApi.endsWith(`+${env.minecraft}`)) add("error", "ENV-API", `Fabric API '${env.fabricApi}' が Minecraft ${env.minecraft} 用ではありません (末尾が +${env.minecraft} である必要があります)`);
  if (cmpVer(env.minecraft, "1.21.2") >= 0 && cmpVer(env.loader, "0.16.9") < 0) add("warning", "ENV-LOADER", `Fabric Loader ${env.loader} は古い可能性があります (0.16.9 以上を推奨)`);

  // プロファイルと生成コードの対応
  if (env.profile === "mc1_21_11_mojmap" && env.mappings !== "mojmap") add("error", "ENV-MAP", "1.21.11 プロファイルのコードは Mojang 名で生成されます。マッピングを Yarn にするとコンパイルできません");
  if (env.profile === "mc1_21_1_yarn" && env.mappings !== "yarn") add("error", "ENV-MAP", "1.21.1 プロファイルのコードは Yarn 名で生成されます。マッピングを Mojang にするとコンパイルできません");
  if (env.profile === "mc1_21_11_mojmap" && env.minecraft !== "1.21.11") add("warning", "ENV-MC", "生成コードは Minecraft 1.21.11 の API で検証されています。他バージョンではコンパイルエラーになる可能性があります");
  if (env.profile === "mc1_21_1_yarn" && env.minecraft !== "1.21.1") add("warning", "ENV-MC", "生成コードは Minecraft 1.21.1 の API で検証されています。他バージョンではコンパイルエラーになる可能性があります");
  return out;
}
