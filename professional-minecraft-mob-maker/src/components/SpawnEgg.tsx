import { useId } from "react";

export function SpawnEgg({
  base,
  spots,
  size = 32,
  className,
}: {
  base: string;
  spots: string;
  size?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 40" className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <path d="M16 2.5C24.2 2.5 29.5 10 29.5 18.5C29.5 29.2 23.6 37.2 16 37.2C8.4 37.2 2.5 29.2 2.5 18.5C2.5 10 7.8 2.5 16 2.5Z" />
        </clipPath>
      </defs>
      <path
        d="M16 2.5C24.2 2.5 29.5 10 29.5 18.5C29.5 29.2 23.6 37.2 16 37.2C8.4 37.2 2.5 29.2 2.5 18.5C2.5 10 7.8 2.5 16 2.5Z"
        fill={base}
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="1.2"
      />
      <g clipPath={`url(#${id})`} fill={spots}>
        <circle cx="11" cy="12" r="2.1" />
        <circle cx="20" cy="15" r="2.6" />
        <circle cx="13" cy="20" r="1.5" />
        <circle cx="21.5" cy="23" r="1.7" />
        <circle cx="15" cy="27" r="2.2" />
        <circle cx="9" cy="24" r="1.3" />
      </g>
      <path d="M8 10c2-3 5-4.5 8-4.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
