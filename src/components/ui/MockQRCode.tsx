export function MockQRCode({ seed, size = 180 }: { seed: string; size?: number }) {
  const cells = 11;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const rand = (i: number) => {
    const x = Math.sin(hash + i * 999) * 10000;
    return x - Math.floor(x);
  };

  const isFinder = (r: number, c: number) =>
    (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3);

  const cellSize = size / cells;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl bg-white">
      {Array.from({ length: cells }).map((_, r) =>
        Array.from({ length: cells }).map((_, c) => {
          const filled = isFinder(r, c)
            ? !(r === 1 && c === 1) && !(r === 1 && c === cells - 2) && !(r === cells - 2 && c === 1)
            : rand(r * cells + c) > 0.55;
          if (!filled) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#192F4D"
            />
          );
        })
      )}
    </svg>
  );
}
