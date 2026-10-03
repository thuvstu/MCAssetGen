/** Hand-drawn pixel mark: a stepped blade crossing a guard, in Hypixel gold. */
export function Logo({ size = 34, className = '' }: { size?: number; className?: string }) {
  const blade: [number, number][] = [
    [7, 11],
    [9, 9],
    [11, 7],
    [13, 5],
    [15, 3],
  ];
  const guard: [number, number][] = [
    [3, 7],
    [5, 9],
    [9, 13],
    [11, 15],
  ];
  const hilt: [number, number][] = [
    [5, 13],
    [3, 15],
  ];
  const cells = [...blade, ...guard, ...hilt];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Skyblock Texture Forge"
    >
      <defs>
        <linearGradient id="lg-steel" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#8f7ad6" />
          <stop offset="0.45" stopColor="#e8e8f0" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="lg-gold" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#c87a00" />
          <stop offset="1" stopColor="#ffc84d" />
        </linearGradient>
      </defs>
      <g>
        {cells.map(([x, y], i) => (
          <rect key={`s${i}`} x={x + 1} y={y + 1} width="2" height="2" fill="#000" opacity="0.55" />
        ))}
        {blade.map(([x, y], i) => (
          <rect key={`b${i}`} x={x} y={y} width="2" height="2" fill="url(#lg-steel)" />
        ))}
        <rect x="17" y="1" width="2" height="2" fill="#ffffff" />
        {guard.map(([x, y], i) => (
          <rect key={`g${i}`} x={x} y={y} width="2" height="2" fill="url(#lg-gold)" />
        ))}
        {hilt.map(([x, y], i) => (
          <rect key={`h${i}`} x={x} y={y} width="2" height="2" fill="#6b4a12" />
        ))}
        <rect x="7" y="11" width="2" height="2" fill="url(#lg-gold)" />
      </g>
    </svg>
  );
}
