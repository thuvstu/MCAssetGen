import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  canvas: HTMLCanvasElement | null;
  size: number;
}

export default function Minecraft3DPreview({ canvas }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !canvas) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(2.4, 2.0, 2.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // テクスチャの更新とサンプリング設定（Minecraft特有のピクセル感を保持）
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    // 立方体ブロック
    const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.65,
      metalness: 0.15,
      transparent: true,
      alphaTest: 0.05,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // エッジライン
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    cube.add(wireframe);

    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffecd2, 1.8);
    dirLight1.position.set(4, 6, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7090ff, 0.9);
    dirLight2.position.set(-4, -2, -3);
    scene.add(dirLight2);

    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      cube.rotation.y += deltaX * 0.012;
      cube.rotation.x += deltaY * 0.012;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animId = 0;
    const animate = () => {
      if (autoRotate) {
        cube.rotation.y += 0.008;
      }
      texture.needsUpdate = true;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [canvas]);

  return (
    <div className="relative flex flex-col h-full w-full select-none bg-[#0a0d14]">
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[2px] bg-black/70 px-2 py-0.5 font-bit text-[9px] text-[var(--ink3)] uppercase tracking-wider backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)] animate-pulse" />
        3D View · ドラッグで回転
      </div>
    </div>
  );
}
