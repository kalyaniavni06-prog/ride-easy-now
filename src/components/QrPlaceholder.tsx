/** Deterministic QR-style visual placeholder (not a scannable code). */
export function QrPlaceholder({ value, size = 128 }: { value: string; size?: number }) {
  const cells = 21;
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = Math.abs(h) % 2147483647 || 7;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);

  const rects: string[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFinder(r, c)) continue;
      if (next() > 0.52) rects.push(`${r},${c}`);
    }
  }

  const finder = (r: number, c: number) => (
    <g key={`f-${r}-${c}`}>
      <rect x={c} y={r} width={7} height={7} fill="currentColor" />
      <rect x={c + 1} y={r + 1} width={5} height={5} fill="var(--color-card)" />
      <rect x={c + 2} y={r + 2} width={3} height={3} fill="currentColor" />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      role="img"
      aria-label={`QR code placeholder for ${value}`}
      className="rounded-lg bg-card text-foreground"
      shapeRendering="crispEdges"
    >
      {finder(0, 0)}
      {finder(0, cells - 7)}
      {finder(cells - 7, 0)}
      {rects.map((k) => {
        const parts = k.split(",");
        return (
          <rect key={k} x={Number(parts[1])} y={Number(parts[0])} width={1} height={1} fill="currentColor" />
        );
      })}
    </svg>
  );
}
