import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut, Box, Sparkles } from "lucide-react";

interface BlockPreview3DProps {
  canvas: HTMLCanvasElement | null;
  textureName?: string;
}

export function BlockPreview3D({ canvas, textureName }: BlockPreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [blockShape, setBlockShape] = useState<"cube" | "item_plate" | "multiblock">("cube");
  const [bgStyle, setBgStyle] = useState<"dark" | "mc_day" | "nether">("dark");
  const [lightingIntensity, setLightingIntensity] = useState<number>(1.2);

  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.35, y: -0.65 });
  const zoomRef = useRef(3.5);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, zoomRef.current);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    ambientLight.name = "ambientLight";
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight1.position.set(4, 8, 5);
    dirLight1.castShadow = true;
    dirLight1.name = "dirLight1";
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x88aacc, 0.5);
    dirLight2.position.set(-5, -3, -4);
    dirLight2.name = "dirLight2";
    scene.add(dirLight2);

    // Ground shadow receiver / Grid
    const grid = new THREE.GridHelper(10, 10, 0x55ff55, 0x334433);
    grid.position.y = -0.8;
    grid.name = "grid";
    scene.add(grid);

    // Render loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (meshRef.current) {
        if (autoRotate && !isDraggingRef.current) {
          rotationRef.current.y += 0.008;
        }
        meshRef.current.rotation.x = rotationRef.current.x;
        meshRef.current.rotation.y = rotationRef.current.y;
      }

      if (cameraRef.current) {
        cameraRef.current.position.set(
          0,
          1.0,
          zoomRef.current
        );
        cameraRef.current.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 360;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, []);

  // Update lights intensity
  useEffect(() => {
    if (!sceneRef.current) return;
    const dir = sceneRef.current.getObjectByName("dirLight1") as THREE.DirectionalLight;
    if (dir) dir.intensity = lightingIntensity;
  }, [lightingIntensity]);

  // Update background and scene styling
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const grid = scene.getObjectByName("grid") as THREE.GridHelper;

    if (bgStyle === "mc_day") {
      scene.background = new THREE.Color(0x78a7ff); // Minecraft sky blue
      if (grid) {
        grid.visible = true;
        (grid.material as THREE.LineBasicMaterial).color.set(0x408030);
      }
    } else if (bgStyle === "nether") {
      scene.background = new THREE.Color(0x2d0b0b); // Nether fog red
      if (grid) {
        grid.visible = true;
        (grid.material as THREE.LineBasicMaterial).color.set(0x882020);
      }
    } else {
      scene.background = null; // Transparent / dark container
      if (grid) {
        grid.visible = true;
        (grid.material as THREE.LineBasicMaterial).color.set(0x38384a);
      }
    }
  }, [bgStyle]);

  // Update mesh texture when canvas or shape changes
  useEffect(() => {
    if (!sceneRef.current || !canvas) return;
    const scene = sceneRef.current;

    // Remove previous mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
      if (meshRef.current.geometry) meshRef.current.geometry.dispose();
      meshRef.current = null;
    }

    // Create crisp nearest-neighbor texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    let group = new THREE.Group();

    if (blockShape === "cube") {
      // Standard Minecraft Block Cube (1x1x1)
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.1,
        transparent: true,
        alphaTest: 0.3,
      });
      const cubeMesh = new THREE.Mesh(geometry, material);
      cubeMesh.castShadow = true;
      group.add(cubeMesh);
    } else if (blockShape === "item_plate") {
      // Held item / 2D floating sprite card
      const geometry = new THREE.BoxGeometry(1.2, 1.2, 0.05);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        alphaTest: 0.2,
      });
      const plateMesh = new THREE.Mesh(geometry, material);
      group.add(plateMesh);
    } else if (blockShape === "multiblock") {
      // 2x2x2 Block Structure (Showcases how blocks tile together!)
      const geometry = new THREE.BoxGeometry(0.65, 0.65, 0.65);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.1,
        transparent: true,
        alphaTest: 0.3,
      });

      const offsets = [
        [-0.35, -0.35, -0.35],
        [0.35, -0.35, -0.35],
        [-0.35, 0.35, -0.35],
        [0.35, 0.35, -0.35],
        [-0.35, -0.35, 0.35],
        [0.35, -0.35, 0.35],
        [-0.35, 0.35, 0.35],
        [0.35, 0.35, 0.35],
      ];

      offsets.forEach(([x, y, z]) => {
        const m = new THREE.Mesh(geometry, material);
        m.position.set(x, y, z);
        group.add(m);
      });
    }

    // Cast as Mesh for animation wrapper
    meshRef.current = group as unknown as THREE.Mesh;
    meshRef.current.position.y = 0;
    scene.add(meshRef.current);
  }, [canvas, blockShape]);

  // Mouse drag handlers for 3D rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMousePosRef.current.x;
    const dy = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.y += dx * 0.01;
    rotationRef.current.x = Math.max(-1.4, Math.min(1.4, rotationRef.current.x + dy * 0.01));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomRef.current = Math.max(1.8, Math.min(6.5, zoomRef.current + e.deltaY * 0.003));
  };

  const resetView = () => {
    rotationRef.current = { x: 0.35, y: -0.65 };
    zoomRef.current = 3.5;
  };

  return (
    <div className="flex flex-col h-full bg-[#171622] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* 3D View Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white/5 border-b border-white/10 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <Box className="w-4 h-4" /> 3Dブロックプレビュー
          </span>
          {textureName && (
            <span className="bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded text-[11px]">
              {textureName}
            </span>
          )}
        </div>

        {/* View Options */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setBlockShape("cube")}
              className={`px-2.5 py-1 rounded text-xs transition ${
                blockShape === "cube" ? "bg-emerald-600 text-white font-medium" : "hover:text-white"
              }`}
              title="単一ブロック (1x1x1)"
            >
              単体ブロック
            </button>
            <button
              onClick={() => setBlockShape("multiblock")}
              className={`px-2.5 py-1 rounded text-xs transition ${
                blockShape === "multiblock" ? "bg-emerald-600 text-white font-medium" : "hover:text-white"
              }`}
              title="2x2x2 建築配置 (タイリング確認)"
            >
              2x2配置
            </button>
            <button
              onClick={() => setBlockShape("item_plate")}
              className={`px-2.5 py-1 rounded text-xs transition ${
                blockShape === "item_plate" ? "bg-emerald-600 text-white font-medium" : "hover:text-white"
              }`}
              title="スプライト / アイテム板"
            >
              アイテム板
            </button>
          </div>

          {/* Background Switcher */}
          <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setBgStyle("dark")}
              className={`px-2 py-1 rounded text-xs ${bgStyle === "dark" ? "bg-zinc-700 text-white" : "text-zinc-400"}`}
              title="ダークスタジオ"
            >
              スタジオ
            </button>
            <button
              onClick={() => setBgStyle("mc_day")}
              className={`px-2 py-1 rounded text-xs ${bgStyle === "mc_day" ? "bg-sky-600 text-white" : "text-zinc-400"}`}
              title="マイクラ昼空"
            >
              マイクラ空
            </button>
            <button
              onClick={() => setBgStyle("nether")}
              className={`px-2 py-1 rounded text-xs ${bgStyle === "nether" ? "bg-red-800 text-white" : "text-zinc-400"}`}
              title="ネザー霧"
            >
              ネザー
            </button>
          </div>
        </div>
      </div>

      {/* 3D Interactive Canvas Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="relative flex-1 min-h-[380px] cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "none" }}
      >
        {/* Floating Controls Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded transition ${autoRotate ? "text-emerald-400 bg-white/10" : "text-zinc-400 hover:text-white"}`}
            title={autoRotate ? "回転を一時停止" : "自動回転を開始"}
          >
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="視点をリセット"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              zoomRef.current = Math.max(1.8, zoomRef.current - 0.5);
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="ズームイン"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              zoomRef.current = Math.min(6.5, zoomRef.current + 0.5);
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="ズームアウト"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Instructions Bottom-Left */}
        <div className="absolute bottom-3 left-3 text-[11px] text-zinc-400 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded border border-white/10 pointer-events-none">
          ドラッグで360°自由回転 / スクロールで拡大縮小
        </div>

        {/* Crisp pixel notice */}
        <div className="absolute bottom-3 right-3 text-[11px] text-emerald-400/90 bg-emerald-950/70 border border-emerald-500/30 px-2 py-1 rounded backdrop-blur-sm pointer-events-none flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> NearestFilter (ぼやけゼロ)
        </div>
      </div>

      {/* Lighting / Render tuning slider */}
      <div className="px-4 py-2.5 bg-black/30 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>光の強さ:</span>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={lightingIntensity}
            onChange={(e) => setLightingIntensity(+e.target.value)}
            className="w-24 accent-emerald-500"
          />
          <span className="font-mono text-zinc-200">{lightingIntensity.toFixed(1)}x</span>
        </div>
        <div className="text-[11px] text-zinc-500">
          Minecraftのシェーダー・ライティングをシミュレート
        </div>
      </div>
    </div>
  );
}
