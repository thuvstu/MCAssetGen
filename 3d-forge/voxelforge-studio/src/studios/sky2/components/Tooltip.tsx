/**
 * Vanilla tooltip: #100010 @ F0 background with notched corners and a 1px
 * #5000FF→#28007F border at 0x50 alpha, inset by one unit — exactly the
 * geometry Minecraft draws. Text uses § formatting codes with the vanilla
 * drop shadow (colour ÷ 4, offset one unit).
 */
const MC: Record<string, string> = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA', '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', a: '#55FF55', b: '#55FFFF', c: '#FF5555', d: '#FF55FF', e: '#FFFF55', f: '#FFFFFF',
};
const shadow = (hex: string) => {
  const v = parseInt(hex.slice(1), 16);
  const r = ((v >> 16) & 255) >> 2, g = ((v >> 8) & 255) >> 2, b = (v & 255) >> 2;
  return `rgb(${r},${g},${b})`;
};

function Line({ src }: { src: string }) {
  if (!src) return <div className="h-[0.9em]" />;
  const segs: { t: string; c: string; b: boolean }[] = [];
  let c = MC['f'];
  let b = false;
  const parts = src.split('§');
  if (parts[0]) segs.push({ t: parts[0], c, b });
  for (const p of parts.slice(1)) {
    const code = p[0]?.toLowerCase();
    if (code && MC[code]) { c = MC[code]; b = false; }
    else if (code === 'l') b = true;
    else if (code === 'r') { c = MC['f']; b = false; }
    const t = p.slice(1);
    if (t) segs.push({ t, c, b });
  }
  return (
    <div className="whitespace-pre leading-[1.38]">
      {segs.map((s, i) => (
        <span key={i} style={{ color: s.c, textShadow: `2px 2px 0 ${shadow(s.c)}`, fontWeight: s.b ? 900 : 400, letterSpacing: s.b ? '0.04em' : undefined }}>
          {s.t}
        </span>
      ))}
    </div>
  );
}

export function Tooltip({ lines, className = '' }: { lines: string[]; className?: string }) {
  const u = 2;
  const notch = `polygon(${u}px 0, calc(100% - ${u}px) 0, calc(100% - ${u}px) ${u}px, 100% ${u}px, 100% calc(100% - ${u}px), calc(100% - ${u}px) calc(100% - ${u}px), calc(100% - ${u}px) 100%, ${u}px 100%, ${u}px calc(100% - ${u}px), 0 calc(100% - ${u}px), 0 ${u}px, ${u}px ${u}px)`;
  return (
    <div className={`inline-block font-display text-[15px] ${className}`} style={{ background: 'rgba(16,0,16,0.94)', clipPath: notch, padding: u }}>
      <div style={{ border: `${u}px solid transparent`, borderImage: 'linear-gradient(to bottom, rgba(80,0,255,0.31), rgba(40,0,127,0.31)) 1' }}>
        <div className="px-[8px] py-[6px]">
          {lines.map((l, i) => (
            <div key={i} className={i === 0 ? 'mb-[4px]' : ''}>
              <Line src={l} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
