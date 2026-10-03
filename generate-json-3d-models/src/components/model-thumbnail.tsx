import { useMemo } from "react";
import { isTilted, poseOf, type Vec3, type VoxelModel } from "@/lib/models";

function shade(color: string, factor: number) {
  return "#" + [1, 3, 5].map(i => Math.min(255, Math.round(parseInt(color.slice(i, i + 2), 16) * factor)).toString(16).padStart(2, "0")).join("");
}
export default function ModelThumbnail({ model, className = "" }: { model: VoxelModel; className?: string }) {
  const drawing = useMemo(() => {
    const angle = isTilted(poseOf(model)) ? -Math.PI / 4 : 0;
    const rotate = (v: Vec3): Vec3 => [(v[0] - 8) * Math.cos(angle) - (v[1] - 8) * Math.sin(angle), (v[0] - 8) * Math.sin(angle) + (v[1] - 8) * Math.cos(angle), v[2] - 8];
    const project = (v: Vec3) => { const [x, y, z] = rotate(v); return [(x - z) * .8, (x + z) * .36 - y * .92]; };
    const faces: { points: number[][]; fill: string; depth: number }[] = [];
    model.cubes.forEach(cube => {
      const [x, y, z] = cube.from; const [X, Y, Z] = cube.to;
      const polygons: { vertices: Vec3[]; shade: number }[] = [
        { vertices: [[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]], shade: 1.12 },
        { vertices: [[X, y, z], [X, y, Z], [X, Y, Z], [X, Y, z]], shade: .68 },
        { vertices: [[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], shade: .93 },
      ];
      polygons.forEach(face => faces.push({ points: face.vertices.map(project), fill: shade(cube.tint ?? model.palette[cube.color], face.shade), depth: face.vertices.reduce((sum, v) => { const r = rotate(v); return sum + r[0] + r[2] + r[1] * .8; }, 0) / 4 }));
    });
    faces.sort((a, b) => a.depth - b.depth);
    const points = faces.flatMap(face => face.points);
    const minX = Math.min(...points.map(p => p[0])); const maxX = Math.max(...points.map(p => p[0]));
    const minY = Math.min(...points.map(p => p[1])); const maxY = Math.max(...points.map(p => p[1]));
    const padding = Math.max(maxX - minX, maxY - minY) * .14;
    return { faces, box: `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}` };
  }, [model]);
  return <svg className={`model-thumbnail ${className}`} viewBox={drawing.box} role="img" aria-label={model.name}>
    <g>{drawing.faces.map((face, index) => <polygon key={index} points={face.points.map(point => point.join(",")).join(" ")} fill={face.fill} stroke={face.fill} strokeWidth="0.025" />)}</g>
  </svg>;
}
