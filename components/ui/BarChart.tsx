interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  defaultColor?: string;
  className?: string;
}

export function BarChart({
  data,
  width = 300,
  height = 140,
  defaultColor = "var(--mint)",
  className,
}: BarChartProps) {
  if (!data.length) return null;

  const pad = { t: 8, r: 8, b: 28, l: 32 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);

  const barW = W / data.length;
  const gap = barW * 0.25;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Gráfico de barras"
      style={{ width: "100%", height: "auto" }}
    >
      {/* Y axis ticks */}
      {yTicks.map((t) => {
        const yPos = pad.t + H * (1 - t);
        return (
          <g key={t}>
            <line
              x1={pad.l} x2={pad.l + W}
              y1={yPos} y2={yPos}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,3"
            />
            <text
              x={pad.l - 4} y={yPos + 3}
              textAnchor="end"
              fontSize="7"
              fill="var(--ivoryDD)"
              fontFamily="var(--fs)"
            >
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bH = (d.value / max) * H;
        const bX = pad.l + i * barW + gap / 2;
        const bY = pad.t + H - bH;
        const bW = barW - gap;
        const color = d.color ?? defaultColor;

        return (
          <g key={i}>
            <defs>
              <linearGradient id={`bar-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <rect
              x={bX} y={bY} width={bW} height={bH}
              rx="3" ry="3"
              fill={`url(#bar-fill-${i})`}
            />
            <text
              x={bX + bW / 2} y={height - 10}
              textAnchor="middle"
              fontSize="7.5"
              fill="var(--ivoryDD)"
              fontFamily="var(--fs)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
