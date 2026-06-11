import { defineComponent, ref, type PropType } from 'vue';

export interface ChartPoint {
  label: string;
  value: number;
  color?: string;
  amount?: number;
}

const money = (value: number) => `L. ${Math.round(value).toLocaleString('es-HN')}`;
const shortMoney = (value: number) => `L.${Math.round(value / 1000)}k`;

export const InteractiveBarChart = defineComponent({
  name: 'InteractiveBarChart',
  props: {
    data: { type: Array as PropType<ChartPoint[]>, required: true },
    color: { type: String, default: '#38BDF8' },
    label: { type: String, default: 'Ventas' },
  },
  setup(props) {
    const hovered = ref<number | null>(null);
    return () => {
      const data = props.data.length ? props.data : [{ label: 'Sin datos', value: 0 }];
      const width = 640;
      const height = 230;
      const padL = 52;
      const padR = 20;
      const padT = 16;
      const padB = 34;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const max = Math.max(...data.map((d) => d.value), 1);
      const gap = Math.max(18, plotW / data.length * 0.28);
      const barW = Math.max(34, (plotW - gap * (data.length - 1)) / data.length * 0.72);
      const step = plotW / data.length;
      const ticks = [0, 0.25, 0.5, 0.75, 1];
      const hIndex = hovered.value;
      const h = hIndex !== null ? data[hIndex] : null;
      const hX = hIndex !== null ? padL + hIndex * step + step / 2 : 0;
      const hY = h ? padT + plotH - (h.value / max) * plotH : 0;

      return (
        <div class="relative w-full h-full">
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {ticks.map((t) => {
              const y = padT + plotH - plotH * t;
              const val = max * t;
              return (
                <g key={t}>
                  <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="#F1F5F9" stroke-dasharray="3 3" />
                  <text x={12} y={y + 4} font-size="11" fill="#94A3B8">{shortMoney(val)}</text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const x = padL + i * step + (step - barW) / 2;
              const barH = max === 0 ? 0 : (d.value / max) * plotH;
              const y = padT + plotH - barH;
              const active = hovered.value === i;
              return (
                <g key={d.label} onMouseenter={() => (hovered.value = i)} onMouseleave={() => (hovered.value = null)} style={{ cursor: 'pointer' }}>
                  {active && <rect x={x - 10} y={padT} width={barW + 20} height={plotH} fill="rgba(15,23,42,0.08)" />}
                  <rect x={x} y={y} width={barW} height={barH} rx="7" fill={d.color || props.color} opacity={active ? 1 : 0.92} />
                  <text x={x + barW / 2} y={height - 12} text-anchor="middle" font-size="12" fill="#94A3B8">{d.label}</text>
                </g>
              );
            })}
            {h && (
              <foreignObject x={Math.min(Math.max(hX - 75, 8), width - 160)} y={Math.max(hY - 72, 4)} width="150" height="68">
                <div xmlns="http://www.w3.org/1999/xhtml" style="background:#0F172A;color:white;border-radius:14px;padding:10px 12px;font-size:12px;box-shadow:0 14px 30px rgba(15,23,42,0.22)">
                  <div style="font-weight:700;margin-bottom:5px">{h.label}</div>
                  <div><span style="color:#38BDF8">{props.label}:</span> {money(h.value)}</div>
                </div>
              </foreignObject>
            )}
          </svg>
        </div>
      );
    };
  },
});

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

export const InteractivePieChart = defineComponent({
  name: 'InteractivePieChart',
  props: {
    data: { type: Array as PropType<ChartPoint[]>, required: true },
  },
  setup(props) {
    const hovered = ref<number | null>(null);
    return () => {
      const data = props.data.filter((d) => d.value > 0);
      const total = data.reduce((a, b) => a + b.value, 0) || 1;
      let currentAngle = 0;
      const h = hovered.value !== null ? data[hovered.value] : null;
      return (
        <div class="relative w-full h-full flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 220 180">
            {data.map((d, i) => {
              const angle = (d.value / total) * 360;
              const start = currentAngle;
              const end = currentAngle + angle - 2;
              currentAngle += angle;
              const active = hovered.value === i;
              return (
                <path
                  key={d.label}
                  d={describeArc(110, 90, active ? 66 : 61, start, end)}
                  fill="none"
                  stroke={d.color || '#38BDF8'}
                  stroke-width={active ? 31 : 26}
                  stroke-linecap="round"
                  onMouseenter={() => (hovered.value = i)}
                  onMouseleave={() => (hovered.value = null)}
                  style={{ cursor: 'pointer', transition: 'all .15s ease' }}
                />
              );
            })}
            <circle cx="110" cy="90" r="34" fill="#fff" />
            <text x="110" y="85" text-anchor="middle" font-size="12" font-weight="700" fill="#0F172A">{h ? h.label : 'Total'}</text>
            <text x="110" y="103" text-anchor="middle" font-size="12" font-weight="700" fill="#38BDF8">{h ? `${h.value}%` : `${data.reduce((a,b)=>a+b.value,0)}%`}</text>
          </svg>
          {h && (
            <div class="absolute px-3 py-2 rounded-xl text-xs shadow-lg" style={{ background: '#0F172A', color: '#fff', right: '8px', top: '8px' }}>
              <div class="font-bold mb-1">{h.label}</div>
              <div><span style={{ color: h.color || '#38BDF8' }}>Participación:</span> {h.value}%</div>
              {typeof h.amount === 'number' && <div>Monto: {money(h.amount)}</div>}
            </div>
          )}
        </div>
      );
    };
  },
});

export const InteractiveAreaChart = defineComponent({
  name: 'InteractiveAreaChart',
  props: {
    data: { type: Array as PropType<{ label: string; ventas: number; compras: number }[]>, required: true },
  },
  setup(props) {
    const hovered = ref<number | null>(null);
    return () => {
      const data = props.data.length ? props.data : [{ label: 'Sin datos', ventas: 0, compras: 0 }];
      const width = 640;
      const height = 230;
      const padL = 42;
      const padR = 20;
      const padT = 18;
      const padB = 34;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const max = Math.max(...data.flatMap((d) => [d.ventas, d.compras]), 1);
      const xFor = (i: number) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
      const yFor = (v: number) => padT + plotH - (v / max) * plotH;
      const linePath = (key: 'ventas' | 'compras') => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d[key])}`).join(' ');
      const areaPath = (key: 'ventas' | 'compras') => `${linePath(key)} L ${xFor(data.length - 1)} ${padT + plotH} L ${xFor(0)} ${padT + plotH} Z`;
      const hIndex = hovered.value;
      const h = hIndex !== null ? data[hIndex] : null;
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + plotH - plotH * t;
            return <line key={t} x1={padL} x2={width - padR} y1={y} y2={y} stroke="#F1F5F9" stroke-dasharray="3 3" />;
          })}
          <path d={areaPath('ventas')} fill="rgba(248,113,113,0.18)" />
          <path d={linePath('ventas')} fill="none" stroke="#F87171" stroke-width="3" />
          <path d={areaPath('compras')} fill="rgba(251,146,60,0.13)" />
          <path d={linePath('compras')} fill="none" stroke="#FB923C" stroke-width="3" />
          {data.map((d, i) => (
            <g key={d.label} onMouseenter={() => (hovered.value = i)} onMouseleave={() => (hovered.value = null)} style={{ cursor: 'pointer' }}>
              <rect x={xFor(i) - 24} y={padT} width="48" height={plotH} fill="transparent" />
              <circle cx={xFor(i)} cy={yFor(d.ventas)} r={hovered.value === i ? 5 : 3} fill="#F87171" />
              <circle cx={xFor(i)} cy={yFor(d.compras)} r={hovered.value === i ? 5 : 3} fill="#FB923C" />
              <text x={xFor(i)} y={height - 12} text-anchor="middle" font-size="11" fill="#94A3B8">{d.label}</text>
            </g>
          ))}
          {h && (
            <foreignObject x={Math.min(Math.max(xFor(hIndex!) - 80, 8), width - 170)} y={Math.max(Math.min(yFor(h.ventas), yFor(h.compras)) - 76, 4)} width="160" height="78">
              <div xmlns="http://www.w3.org/1999/xhtml" style="background:#0F172A;color:white;border-radius:14px;padding:10px 12px;font-size:12px;box-shadow:0 14px 30px rgba(15,23,42,0.22)">
                <div style="font-weight:700;margin-bottom:5px">{h.label}</div>
                <div><span style="color:#F87171">Ventas:</span> {money(h.ventas)}</div>
                <div><span style="color:#FB923C">Compras:</span> {money(h.compras)}</div>
              </div>
            </foreignObject>
          )}
        </svg>
      );
    };
  },
});
