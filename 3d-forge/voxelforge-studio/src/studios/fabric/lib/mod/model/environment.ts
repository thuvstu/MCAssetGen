export type MappingKind = "mojmap" | "yarn";
export type ProfileId = "mc1_21_11_mojmap" | "mc1_21_1_yarn";

/** Build environment embedded in generated Gradle projects. */
export interface TargetEnv {
  profile: ProfileId;
  minecraft: string;
  mappings: MappingKind;
  /** Used only by Yarn profiles (for example 1.21.1+build.3). */
  yarn: string;
  loomPlugin: string;
  loom: string;
  gradle: string;
  loader: string;
  fabricApi: string;
  /** Fabric Language Kotlin artifact version. */
  kotlinLoader: string;
  /** Kotlin Gradle plugin version. Must match Fabric Language Kotlin. */
  kotlin: string;
  java: number;
}

export interface ProfileInfo {
  id: ProfileId;
  label: string;
  note: string;
  env: TargetEnv;
  verified: string;
}
