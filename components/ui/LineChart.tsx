interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  className?: string;
}

export function LineChart({
  data,
  width = 300,
  height = 100,
  color = "var(--mint)",
  filled = true,
  className,
}: LineChartProps) {
  if (!data.length) return null;

  const pad = { t: 8, r: 8, b: 24, l: 8 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => pad.l + (i / (data.length - 1)) * W;
  const y = (v: number) => pad.t + H - ((v - min) / range) * H;

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const path = `M ${data.map((d, i) => `${x(i)} ${y(d.value)}`).join(" L ")}`;
  const area = `${path} L ${x(data.length - 1)} ${pad.t + H} L ${pad.l} ${pad.t + H} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Gráfico de linha"
      style={{ width: "100%", height: "auto" }}
    >
      {/* Grid lines */}
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad.l} x2={pad.l + W}
          y1={pad.t + H * (1 - t)} y2={pad.t + H * (1 - t)}
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,3"
        />
      ))}

      {/* Area fill */}
      {filled && (
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {filled && <path d={area} fill="url(#area-fill)" />}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points + labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="2.5" fill={color} />
          {i % Math.max(1, Math.floor(data.length / 5)) === 0 && (
            <text
              x={x(i)} y={height - 6}
              textAnchor="middle"
              fontSize="8"
              fill="var(--ivoryDD)"
              fontFamily="var(--fs)"
            >
              {d.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
