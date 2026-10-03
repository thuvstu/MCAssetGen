export function Slider({
  label,
  value,
  min,
  max,
  suffix = "%",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;
  const text = suffix === "°" && value > 0 ? `+${value}${suffix}` : `${value}${suffix}`;
  return (
    <div className="slider">
      <div className="slider-head">
        <span>{label}</span>
        <output>{text}</output>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={{ background: `linear-gradient(90deg, var(--amber) ${progress}%, var(--stone-0) ${progress}%)` }}
      />
    </div>
  );
}
