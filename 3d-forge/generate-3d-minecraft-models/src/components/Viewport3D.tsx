import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { PixelCell, VoxelCube } from "../types/model";

interface ProjectedPoint {
  x: number;
  y: number;
  depth: number;
}

interface ShadedCorner extends ProjectedPoint {
  brightness: number;
}

interface RenderSurface {
  corners: ShadedCorner[];
  depth: number;
  color: string;
  alpha: number;
  emissive: boolean;
  cubeId: string;
}

function rgbaWithShade(hex: string, alpha: number, shade: number): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value * shade)));
  return `rgba(${channel(red)}, ${channel(green)}, ${channel(blue)}, ${alpha})`;
}

function pointInPolygon(x: number, y: number, points: ProjectedPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Vertex ambient occlusion, per the classic voxel formulation:
 *   ao = (side1 && side2) ? 0 : 3 - (side1 + side2 + corner)
 * https://0fps.net/2013-07-03/ambient-occlusion-for-minecraft-like-worlds/
 */
function vertexAO(side1: number, side2: number, corner: number): number {
  if (side1 && side2) return 0;
  return 3 - (side1 + side2 + corner);
}

export interface CubeTransformAction {
  cubeIds: string[];
  kind: "rotate" | "inflate" | "depth" | "emissive";
  value: number;
}

interface Viewport3DProps {
  pixels: PixelCell[];
  voxels: VoxelCube[];
  textureWidth: number;
  textureHeight: number;
  yaw: number;
  pitch: number;
  zoom: number;
  autoRotate: boolean;
  showWireframe: boolean;
  showGrid: boolean;
  showUVOverlay: boolean;
  showAxes: boolean;
  showAO: boolean;
  lightAngle: number;
  selectedCubeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRotate: (deltaX: number, deltaY: number) => void;
  onZoom: (amount: number) => void;
  canvasExportRef: RefObject<HTMLCanvasElement | null>;
}

export function Viewport3D({
  pixels,
  voxels,
  textureWidth,
  textureHeight,
  yaw,
  pitch,
  zoom,
  autoRotate,
  showWireframe,
  showGrid,
  showUVOverlay,
  showAxes,
  showAO,
  lightAngle,
  selectedCubeIds,
  onSelectionChange,
  onRotate,
  onZoom,
  canvasExportRef,
}: Viewport3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    x: number;
    y: number;
    moved: boolean;
    ctrl: boolean;
    shift: boolean;
  } | null>(null);
  const surfacesRef = useRef<RenderSurface[]>([]);
  const [hoveredCubeId, setHoveredCubeId] = useState<string | null>(null);

  useEffect(() => {
    if (!autoRotate) return;
    let frameId = 0;
    let previousTime = 0;
    const step = (time: number) => {
      if (time - previousTime >= 32) {
        onRotate(0.42, 0);
        previousTime = time;
      }
      frameId = window.requestAnimationFrame(step);
    };
    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [autoRotate, onRotate]);

  useEffect(() => {
    const canvas = canvasExportRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const redraw = () => {
      const bounds = container.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = bounds.width;
      const height = bounds.height;
      context.clearRect(0, 0, width, height);

      const scale = Math.max(
        1,
        Math.min((width - 110) / 22, (height - 105) / 21) * zoom,
      );
      const centerX = width / 2;
      const centerY = height * 0.54;
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);

      const project = (x: number, y: number, z: number): ProjectedPoint => {
        const turnedX = x * cosYaw + z * sinYaw;
        const turnedZ = -x * sinYaw + z * cosYaw;
        const tiltedY = y * cosPitch - turnedZ * sinPitch;
        return {
          x: centerX + turnedX * scale,
          y: centerY - tiltedY * scale,
          depth: y * sinPitch + turnedZ * cosPitch,
        };
      };

      const floorY =
        voxels.length > 0
          ? Math.min(...voxels.map((voxel) => voxel.y)) - 0.1
          : -8.1;

      if (showGrid) {
        context.save();
        context.lineWidth = 0.65;
        context.strokeStyle = "rgba(189, 210, 180, 0.085)";
        for (let grid = -12; grid <= 12; grid += 2) {
          [
            [project(-12, floorY, grid), project(12, floorY, grid)],
            [project(grid, floorY, -12), project(grid, floorY, 12)],
          ].forEach(([start, end]) => {
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();
          });
        }
        context.restore();
      }

      if (showAxes) {
        const axisPairs: [ProjectedPoint[], string][] = [
          [[project(-12, floorY, 0), project(12, floorY, 0)], "rgba(218, 118, 102, 0.7)"],
          [[project(0, floorY, 0), project(0, floorY + 18, 0)], "rgba(167, 200, 115, 0.7)"],
          [[project(0, floorY, -12), project(0, floorY, 12)], "rgba(116, 158, 214, 0.7)"],
        ];
        context.save();
        context.lineWidth = 1.5;
        axisPairs.forEach(([pair, stroke]) => {
          context.strokeStyle = stroke;
          context.beginPath();
          context.moveTo(pair[0].x, pair[0].y);
          context.lineTo(pair[1].x, pair[1].y);
          context.stroke();
        });
        context.restore();
      }

      const shadow = project(0, floorY - 0.08, 0);
      const shadowWidth = Math.max(34, 5.2 * scale);
      const shadowHeight = Math.max(12, 1.2 * scale);
      const shadowGradient = context.createRadialGradient(
        shadow.x,
        shadow.y + 7,
        2,
        shadow.x,
        shadow.y + 7,
        shadowWidth,
      );
      shadowGradient.addColorStop(0, "rgba(4, 7, 5, 0.36)");
      shadowGradient.addColorStop(1, "rgba(4, 7, 5, 0)");
      context.fillStyle = shadowGradient;
      context.beginPath();
      context.ellipse(
        shadow.x,
        shadow.y + 7,
        shadowWidth,
        shadowHeight,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();

      // Height field for ambient occlusion sampling
      const depthGrid = new Int16Array(textureWidth * textureHeight);
      const pixelMap = new Map<string, PixelCell>();
      pixels.forEach((pixel) => {
        pixelMap.set(`${pixel.col}:${pixel.row}`, pixel);
        depthGrid[pixel.row * textureWidth + pixel.col] = Math.max(1, Math.round(pixel.depth));
      });
      const solid = (col: number, row: number, layer: number) => {
        if (layer < 1) return 0;
        if (col < 0 || col >= textureWidth || row < 0 || row >= textureHeight) return 0;
        return depthGrid[row * textureWidth + col] >= layer ? 1 : 0;
      };

      const cubeMap = new Map<string, VoxelCube>();
      voxels.forEach((cube) => {
        for (let row = cube.row; row < cube.row + cube.rowSpan; row += 1) {
          for (let col = cube.col; col < cube.col + cube.colSpan; col += 1) {
            cubeMap.set(`${col}:${row}`, cube);
          }
        }
      });

      const aspect = textureWidth / textureHeight;
      const modelWidth = aspect >= 1 ? 16 : 16 * aspect;
      const modelHeight = aspect >= 1 ? 16 / aspect : 16;
      const cellW = modelWidth / textureWidth;
      const cellH = modelHeight / textureHeight;

      const lightRad = (lightAngle * Math.PI) / 180;
      const lx = Math.cos(lightRad) * 0.62;
      const ly = 0.68;
      const lz = Math.sin(lightRad) * 0.62;
      const aoStrength = showAO ? 0.42 : 0;

      const surfaces: RenderSurface[] = [];

      pixels.forEach((pixel) => {
        const cube = cubeMap.get(`${pixel.col}:${pixel.row}`);
        if (!cube) return;

        const inflate = cube.inflate;
        const x = -modelWidth / 2 + pixel.col * cellW - inflate;
        const y = -modelHeight / 2 + (textureHeight - pixel.row - 1) * cellH - inflate;
        const z = cube.z - inflate;
        const right = x + cellW + inflate * 2;
        const top = y + cellH + inflate * 2;
        const back = z + cube.depth + inflate * 2;
        const layer = Math.max(1, Math.round(pixel.depth));
        const { col, row } = pixel;

        const sameDepthNeighbor = (candidate?: PixelCell) => {
          if (!candidate) return false;
          const neighborCube = cubeMap.get(`${candidate.col}:${candidate.row}`);
          if (!neighborCube) return false;
          return (
            Math.abs(neighborCube.depth - cube.depth) < 0.001 &&
            Math.abs(neighborCube.z - cube.z) < 0.001
          );
        };

        // Cap faces: outward along Z, in-plane neighbours are (col,row) offsets.
        const capAO = (dc: number, dr: number) =>
          vertexAO(
            solid(col + dc, row, layer + 1),
            solid(col, row + dr, layer + 1),
            solid(col + dc, row + dr, layer + 1),
          );

        // Skirt faces: outward is a column/row step, in-plane is the other axis + layer.
        const skirtAO = (
          faceCol: number,
          faceRow: number,
          planeDelta: number,
          up: boolean,
        ) => {
          const baseLayer = up ? layer : 1;
          const tipLayer = up ? layer + 1 : 0;
          return vertexAO(
            solid(faceCol + planeDelta, faceRow, baseLayer),
            solid(faceCol, faceRow, tipLayer),
            solid(faceCol + planeDelta, faceRow, tipLayer),
          );
        };

        type FaceSpec = {
          normal: [number, number, number];
          neighbor: PixelCell | undefined;
          corners: { p: [number, number, number]; ao: number }[];
        };

        const faces: FaceSpec[] = [
          {
            normal: [0, 0, 1],
            neighbor: undefined,
            corners: [
              { p: [x, y, back], ao: capAO(-1, 1) },
              { p: [right, y, back], ao: capAO(1, 1) },
              { p: [right, top, back], ao: capAO(1, -1) },
              { p: [x, top, back], ao: capAO(-1, -1) },
            ],
          },
          {
            normal: [0, 0, -1],
            neighbor: undefined,
            corners: [
              { p: [right, y, z], ao: 3 },
              { p: [x, y, z], ao: 3 },
              { p: [x, top, z], ao: 3 },
              { p: [right, top, z], ao: 3 },
            ],
          },
          {
            normal: [1, 0, 0],
            neighbor: pixelMap.get(`${col + 1}:${row}`),
            corners: [
              { p: [right, y, z], ao: skirtAO(col + 1, row, 1, false) },
              { p: [right, y, back], ao: skirtAO(col + 1, row, 1, true) },
              { p: [right, top, back], ao: skirtAO(col + 1, row, -1, true) },
              { p: [right, top, z], ao: skirtAO(col + 1, row, -1, false) },
            ],
          },
          {
            normal: [-1, 0, 0],
            neighbor: pixelMap.get(`${col - 1}:${row}`),
            corners: [
              { p: [x, y, back], ao: skirtAO(col - 1, row, 1, true) },
              { p: [x, y, z], ao: skirtAO(col - 1, row, 1, false) },
              { p: [x, top, z], ao: skirtAO(col - 1, row, -1, false) },
              { p: [x, top, back], ao: skirtAO(col - 1, row, -1, true) },
            ],
          },
          {
            normal: [0, 1, 0],
            neighbor: pixelMap.get(`${col}:${row - 1}`),
            corners: [
              { p: [x, top, z], ao: skirtAO(col, row - 1, -1, false) },
              { p: [right, top, z], ao: skirtAO(col, row - 1, 1, false) },
              { p: [right, top, back], ao: skirtAO(col, row - 1, 1, true) },
              { p: [x, top, back], ao: skirtAO(col, row - 1, -1, true) },
            ],
          },
          {
            normal: [0, -1, 0],
            neighbor: pixelMap.get(`${col}:${row + 1}`),
            corners: [
              { p: [x, y, back], ao: skirtAO(col, row + 1, -1, true) },
              { p: [right, y, back], ao: skirtAO(col, row + 1, 1, true) },
              { p: [right, y, z], ao: skirtAO(col, row + 1, 1, false) },
              { p: [x, y, z], ao: skirtAO(col, row + 1, -1, false) },
            ],
          },
        ];

        faces.forEach((face) => {
          if (sameDepthNeighbor(face.neighbor)) return;
          const [nx, ny, nz] = face.normal;
          const facing =
            -nx * sinYaw * cosPitch + ny * sinPitch + nz * cosYaw * cosPitch;
          if (facing <= 0.012) return;

          const lambert = Math.max(0.5, Math.min(1.14, 0.84 + (nx * lx + ny * ly + nz * lz) * 0.34));
          const projected = face.corners.map((corner) => {
            const point = project(corner.p[0], corner.p[1], corner.p[2]);
            const aoFactor = pixel.emissive ? 1 : 1 - aoStrength * (1 - corner.ao / 3);
            return {
              ...point,
              brightness: pixel.emissive ? 1.24 : lambert * aoFactor,
            };
          });

          surfaces.push({
            corners: projected,
            depth:
              projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
            color: pixel.hex,
            alpha: pixel.a,
            emissive: pixel.emissive,
            cubeId: cube.id,
          });
        });
      });

      surfaces.sort((first, second) => first.depth - second.depth);
      surfacesRef.current = surfaces;

      const isSelected = (id: string) => selectedCubeIds.includes(id);
      const isHovered = (id: string) => hoveredCubeId === id;

      surfaces.forEach((surface) => {
        const highlight = isSelected(surface.cubeId) || isHovered(surface.cubeId);
        const [c0, c1, c2, c3] = surface.corners;

        // Fill as two triangles with per-corner brightness. Flipping the shared
        // diagonal when a00 + a11 > a01 + a10 removes the AO anisotropy artifact.
        const flip = c0.brightness + c2.brightness > c1.brightness + c3.brightness;
        const triangles = flip
          ? [
              [c0, c1, c3],
              [c1, c2, c3],
            ]
          : [
              [c0, c1, c2],
              [c0, c2, c3],
            ];

        if (surface.emissive) {
          context.save();
          context.shadowColor = surface.color;
          context.shadowBlur = 12;
          context.beginPath();
          context.moveTo(c0.x, c0.y);
          [c1, c2, c3].forEach((corner) => context.lineTo(corner.x, corner.y));
          context.closePath();
          context.fillStyle = rgbaWithShade(surface.color, surface.alpha, 1.24);
          context.fill();
          context.restore();
        } else {
          triangles.forEach(([a, b, c]) => {
            const midX = (b.x + c.x) / 2;
            const midY = (b.y + c.y) / 2;
            const gradient = context.createLinearGradient(a.x, a.y, midX, midY);
            gradient.addColorStop(0, rgbaWithShade(surface.color, surface.alpha, a.brightness));
            gradient.addColorStop(1, rgbaWithShade(surface.color, surface.alpha, (b.brightness + c.brightness) / 2));
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.lineTo(c.x, c.y);
            context.closePath();
            context.fillStyle = gradient;
            context.fill();
          });
        }

        context.beginPath();
        context.moveTo(c0.x, c0.y);
        [c1, c2, c3].forEach((corner) => context.lineTo(corner.x, corner.y));
        context.closePath();
        context.lineWidth = highlight ? 1.2 : 0.4;
        context.strokeStyle = highlight
          ? "rgba(212, 244, 126, 0.92)"
          : `rgba(8, 12, 9, ${0.1 * surface.alpha})`;
        context.stroke();
      });

      if (showWireframe || selectedCubeIds.length > 0) {
        context.save();
        voxels.forEach((cube) => {
          const highlight = isSelected(cube.id) || isHovered(cube.id);
          if (!showWireframe && !highlight) return;

          const inflate = cube.inflate;
          const x0 = cube.x - inflate;
          const y0 = cube.y - inflate;
          const z0 = cube.z - inflate;
          const x1 = cube.x + cube.width + inflate;
          const y1 = cube.y + cube.height + inflate;
          const z1 = cube.z + cube.depth + inflate;
          const corners = [
            project(x0, y0, z0),
            project(x1, y0, z0),
            project(x1, y1, z0),
            project(x0, y1, z0),
            project(x0, y0, z1),
            project(x1, y0, z1),
            project(x1, y1, z1),
            project(x0, y1, z1),
          ];
          const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7],
          ];

          context.lineWidth = highlight ? 1.6 : 0.8;
          context.strokeStyle = highlight ? "#d4f47e" : "rgba(212, 244, 126, 0.4)";
          edges.forEach(([a, b]) => {
            context.beginPath();
            context.moveTo(corners[a].x, corners[a].y);
            context.lineTo(corners[b].x, corners[b].y);
            context.stroke();
          });
        });
        context.restore();
      }

      if (showUVOverlay) {
        context.save();
        context.textBaseline = "top";
        context.font = "10px ui-monospace, 'SFMono-Regular', Consolas, monospace";
        voxels.forEach((cube) => {
          if (!isSelected(cube.id)) return;
          const anchor = project(
            cube.x + cube.width / 2,
            cube.y + cube.height / 2,
            cube.z + cube.depth,
          );
          const [u1, v1, u2, v2] = cube.uv;
          const label = `[${u1},${v1}] → [${u2},${v2}]`;
          const metricsWidth = context.measureText(label).width + 16;
          context.fillStyle = "rgba(14, 19, 15, 0.9)";
          context.fillRect(anchor.x - metricsWidth / 2, anchor.y - 11, metricsWidth, 22);
          context.strokeStyle = "rgba(212, 244, 126, 0.7)";
          context.lineWidth = 1;
          context.strokeRect(anchor.x - metricsWidth / 2, anchor.y - 11, metricsWidth, 22);
          context.fillStyle = "#dfe6d8";
          context.textAlign = "center";
          context.fillText(label, anchor.x, anchor.y - 6);
        });
        context.restore();
      }
    };

    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [
    pixels,
    voxels,
    textureWidth,
    textureHeight,
    yaw,
    pitch,
    zoom,
    showWireframe,
    showGrid,
    showUVOverlay,
    showAxes,
    showAO,
    lightAngle,
    selectedCubeIds,
    hoveredCubeId,
    canvasExportRef,
  ]);

  const pickCubeAt = (clientX: number, clientY: number): string | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const surfaces = surfacesRef.current;
    for (let i = surfaces.length - 1; i >= 0; i -= 1) {
      if (pointInPolygon(localX, localY, surfaces[i].corners)) {
        return surfaces[i].cubeId;
      }
    }
    return null;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      moved: false,
      ctrl: event.ctrlKey || event.metaKey,
      shift: event.shiftKey,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current) {
      const hitId = pickCubeAt(event.clientX, event.clientY);
      if (hitId !== hoveredCubeId) setHoveredCubeId(hitId);
      return;
    }
    const deltaX = event.clientX - pointerRef.current.x;
    const deltaY = event.clientY - pointerRef.current.y;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) pointerRef.current.moved = true;
    pointerRef.current.x = event.clientX;
    pointerRef.current.y = event.clientY;
    onRotate(deltaX, deltaY);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    pointerRef.current = null;
    if (!pointer || pointer.moved) return;
    const clickedId = pickCubeAt(event.clientX, event.clientY);
    if (!clickedId) {
      onSelectionChange([]);
      return;
    }
    if (pointer.shift || pointer.ctrl) {
      const exists = selectedCubeIds.includes(clickedId);
      onSelectionChange(
        exists
          ? selectedCubeIds.filter((id) => id !== clickedId)
          : [...selectedCubeIds, clickedId],
      );
      return;
    }
    onSelectionChange([clickedId]);
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    onZoom(event.deltaY < 0 ? 0.08 : -0.08);
  };

  const selectedCubes = voxels.filter((cube) => selectedCubeIds.includes(cube.id));
  const primaryCube = selectedCubes[0];

  return (
    <div
      ref={containerRef}
      className="viewport-canvas-wrap"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerRef.current = null;
      }}
      onPointerLeave={() => setHoveredCubeId(null)}
      onWheel={handleWheel}
      role="img"
      aria-label="ドラッグで回転、クリックでキューブを選択できる3Dビューポート（頂点AO適用済み）"
    >
      <canvas ref={canvasExportRef} className="voxel-canvas" />

      {primaryCube && (
        <div className="cube-inspector-hud">
          <div className="cube-inspector-header">
            <span
              className="inspector-color-dot"
              style={{ backgroundColor: primaryCube.color }}
            />
            <strong>{primaryCube.name}</strong>
            <span className="inspector-badge">
              {primaryCube.colSpan}×{primaryCube.rowSpan} px
            </span>
            {primaryCube.emissive && <span className="inspector-emissive">発光</span>}
          </div>
          <div className="cube-inspector-grid">
            <span>
              Group: <b>{primaryCube.groupName}</b>
            </span>
            <span>
              Depth: <b>{primaryCube.depth}</b>
            </span>
            <span>
              UV: <b>[{primaryCube.uv.join(", ")}]</b>
            </span>
            <span>
              From:{" "}
              <b>
                [{primaryCube.x}, {primaryCube.y}, {primaryCube.z}]
              </b>
            </span>
          </div>
          {selectedCubes.length > 1 && (
            <div className="cube-inspector-multi">
              他 {selectedCubes.length - 1} 個のキューブを選択中
            </div>
          )}
        </div>
      )}
    </div>
  );
}
