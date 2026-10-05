import type { GeneratedFile, ModProject } from "./types";
import type { TargetEnv } from "./targets";
import { GRADLEW, GRADLEW_BAT, WRAPPER_JAR_B64, WRAPPER_PROPERTIES } from "./wrapperData";
import { GRADLEW9, GRADLEW9_BAT, WRAPPER9_JAR_B64, WRAPPER9_PROPERTIES } from "./wrapperData9";

const major = (v: string) => parseInt(v.split(".")[0], 10) || 0;

/** gradle/wrapper/* と gradlew。Gradle 9 系は 9.6.1 自身が生成したラッパー、8 系は 8.10.2 のものを使い、distributionUrl だけ環境値に合わせる */
function wrapperFiles(env: TargetEnv): GeneratedFile[] {
  const nine = major(env.gradle) >= 9;
  const props = (nine ? WRAPPER9_PROPERTIES : WRAPPER_PROPERTIES).replace(/gradle-[0-9.]+(-[a-z]+)?-bin\.zip/, `gradle-${env.gradle}-bin.zip`);
  return [
    { path: "gradle/wrapper/gradle-wrapper.properties", kind: "text", content: props },
    { path: "gradle/wrapper/gradle-wrapper.jar", kind: "binary", encoding: "base64", content: nine ? WRAPPER9_JAR_B64 : WRAPPER_JAR_B64 },
    { path: "gradlew", kind: "text", content: nine ? GRADLEW9 : GRADLEW, executable: true },
    { path: "gradlew.bat", kind: "text", content: nine ? GRADLEW9_BAT : GRADLEW_BAT },
  ];
}

/** build.gradle.kts / settings.gradle.kts / gradle.properties / wrapper を環境値(TargetEnv)から生成 */
export function gradleFiles(project: ModProject, env: TargetEnv): GeneratedFile[] {
  const { meta } = project;
  const mojmap = env.mappings === "mojmap";

  const mappingsLine = mojmap
    ? `    mappings(loom.officialMojangMappings())`
    : `    mappings("net.fabricmc:yarn:\${project.property("yarn_mappings")}:v2")`;

  const build = `plugins {
    id("${env.loomPlugin}") version "${env.loom}"
    kotlin("jvm") version "${env.kotlin}"
}

base {
    archivesName.set(project.property("archives_base_name") as String)
}

version = project.property("mod_version") as String
group = project.property("maven_group") as String

repositories {
    mavenCentral()
}

dependencies {
    minecraft("com.mojang:minecraft:\${project.property("minecraft_version")}")
${mappingsLine}
    modImplementation("net.fabricmc:fabric-loader:\${project.property("loader_version")}")
    modImplementation("net.fabricmc.fabric-api:fabric-api:\${project.property("fabric_version")}")
    modImplementation("net.fabricmc:fabric-language-kotlin:\${project.property("kotlin_loader_version")}")
}

tasks.withType<JavaCompile>().configureEach {
    options.release.set(${env.java})
}

kotlin {
    jvmToolchain(${env.java})
}

java {
    withSourcesJar()
    sourceCompatibility = JavaVersion.VERSION_${env.java}
    targetCompatibility = JavaVersion.VERSION_${env.java}
}
`;

  const settings = `pluginManagement {
    repositories {
        maven("https://maven.fabricmc.net/") { name = "Fabric" }
        mavenCentral()
        gradlePluginPortal()
    }
}

// Minecraft ${env.minecraft} / Fabric Loom requires Gradle to run on JDK ${env.java} or newer.
if (!JavaVersion.current().isCompatibleWith(JavaVersion.VERSION_${env.java})) {
    throw GradleException(
        """
        |
        |  [!] This project needs JDK ${env.java}+ to build. Current Gradle JVM: \${JavaVersion.current()}
        |
        |  IntelliJ IDEA:
        |    1. File > Settings > Build, Execution, Deployment > Build Tools > Gradle
        |    2. Set "Gradle JVM" to a JDK ${env.java} (use "Download JDK..." if missing)
        |    3. File > Project Structure > Project > SDK = ${env.java}
        |    4. Click "Reload All Gradle Projects" in the Gradle tool window
        |
        |  Command line:
        |    Set JAVA_HOME to JDK ${env.java}, then run ./gradlew build
        |  (See README.md for details)
        """.trimMargin()
    )
}

rootProject.name = "${meta.modId}"
`;

  const props = `org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true

# --- Build environment (profile: ${env.profile}) ---
minecraft_version=${env.minecraft}
${mojmap ? "# mappings: Mojang official (loom.officialMojangMappings)" : `yarn_mappings=${env.yarn}`}
loader_version=${env.loader}
kotlin_loader_version=${env.kotlinLoader}
fabric_version=${env.fabricApi}

# --- Mod ---
mod_version=${meta.version}
maven_group=${meta.packageName}
archives_base_name=${meta.modId}
`;

  return [
    { path: "build.gradle.kts", kind: "gradle", content: build },
    { path: "settings.gradle.kts", kind: "gradle", content: settings },
    { path: "gradle.properties", kind: "text", content: props },
    ...wrapperFiles(env),
  ];
}
