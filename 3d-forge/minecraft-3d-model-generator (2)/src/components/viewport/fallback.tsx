import type { ModelCube, Vec3 } from "@/lib/model-types";
import { DEFAULT_ROTATION } from "./scene";

const TILT = DEFAULT_ROTATION[2];

function shade(hex: string, amount: number): string {
  return (
    "#" +
    [1, 3, 5]
      .map((index) =>
        Math.min(
          255,
          Math.round(parseInt(hex.slice(index, index + 2), 16) * amount),
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function project([x, y, z]: Vec3): string {
  const rotatedX = x * Math.cos(TILT) - y * Math.sin(TILT);
  const rotatedY = x * Math.sin(TILT) + y * Math.cos(TILT);
  return `${rotatedX * 0.94 + z * 0.4},${-rotatedY * 0.96 + z * 0.2}`;
}

interface FallbackProps {
  cubes: ModelCube[];
  label: string;
  className?: string;
}

/**
 * Static isometric render of a cube list. Used before WebGL is ready, when it
 * is unavailable, and as the thumbnail of variant cards.
 */
export default function ViewportFallback({
  cubes,
  label,
  className = "model-fallback",
}: FallbackProps) {
  return (
    <svg
      viewBox="-27 -26 54 52"
      className={className}
      aria-label={`${label} 3Dモデル`}
      role="img"
    >
      {cubes.map((cube, index) => {
        const [x, y, z] = cube.from;
        const [X, Y, Z] = cube.to;
        const boost = cube.emissive ? 1.25 : 1;
        const faces: { points: Vec3[]; fill: string }[] = [
          {
            points: [
              [X, y, z],
              [X, Y, z],
              [X, Y, Z],
              [X, y, Z],
            ],
            fill: shade(cube.color, 0.65 * boost),
          },
          {
            points: [
              [x, Y, z],
              [X, Y, z],
              [X, Y, Z],
              [x, Y, Z],
            ],
            fill: shade(cube.color, 0.9 * boost),
          },
          {
            points: [
              [x, y, Z],
              [X, y, Z],
              [X, Y, Z],
              [x, Y, Z],
            ],
            fill: shade(cube.color, boost),
          },
        ];
        return (
          <g key={index}>
            {faces.map((face, faceIndex) => (
              <polygon
                key={faceIndex}
                points={face.points.map(project).join(" ")}
                fill={face.fill}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
