import { defineComponent } from 'vue'

export const ResponsiveContainer = defineComponent({
  name: 'ResponsiveContainer',
  props: { width: { default: '100%' }, height: { default: 220 } },
  setup(props, { slots }) {
    return () => <div style={{ width: String(props.width), height: typeof props.height === 'number' ? `${props.height}px` : String(props.height) }}>{slots.default?.()}</div>
  },
})

export const AreaChart = defineComponent({
  name: 'AreaChart',
  props: { data: Array },
  setup(props) {
    return () => (
      <svg width="100%" height="100%" viewBox="0 0 640 220" preserveAspectRatio="none">
        {[40, 80, 120, 160, 200].map((y) => <line x1="0" x2="640" y1={y} y2={y} stroke="#F1F5F9" stroke-dasharray="3 3" />)}
        <path d="M15 160 C100 120 150 145 220 90 C300 55 360 105 430 70 C500 35 560 65 625 42 L625 210 L15 210 Z" fill="rgba(248,113,113,0.18)" />
        <path d="M15 160 C100 120 150 145 220 90 C300 55 360 105 430 70 C500 35 560 65 625 42" fill="none" stroke="#F87171" stroke-width="3" />
        <path d="M15 180 C105 150 155 168 220 135 C300 105 360 145 430 112 C500 90 565 110 625 84 L625 210 L15 210 Z" fill="rgba(251,146,60,0.13)" />
        <path d="M15 180 C105 150 155 168 220 135 C300 105 360 145 430 112 C500 90 565 110 625 84" fill="none" stroke="#FB923C" stroke-width="3" />
        {['Ene','Feb','Mar','Abr','May','Jun','Jul'].map((m,i)=><text x={20+i*98} y="214" font-size="11" fill="#94A3B8">{m}</text>)}
      </svg>
    )
  },
})

export const BarChart = defineComponent({
  name: 'BarChart',
  setup() {
    const heights = [115, 128, 108, 154, 146, 190]
    return () => (
      <svg width="100%" height="100%" viewBox="0 0 640 220" preserveAspectRatio="none">
        {[40, 80, 120, 160, 200].map((y) => <line x1="0" x2="640" y1={y} y2={y} stroke="#F1F5F9" stroke-dasharray="3 3" />)}
        {heights.map((h, i) => <rect x={55+i*95} y={205-h} width="42" height={h} rx="7" fill="#38BDF8" />)}
        {['Ene','Feb','Mar','Abr','May','Jun'].map((m,i)=><text x={62+i*95} y="218" font-size="11" fill="#94A3B8">{m}</text>)}
      </svg>
    )
  },
})

export const PieChart = defineComponent({
  name: 'PieChart',
  setup() {
    return () => (
      <svg width="100%" height="100%" viewBox="0 0 180 160">
        <circle cx="90" cy="80" r="58" fill="none" stroke="#38BDF8" stroke-width="26" stroke-dasharray="95 270" transform="rotate(-90 90 80)" />
        <circle cx="90" cy="80" r="58" fill="none" stroke="#FDBA74" stroke-width="26" stroke-dasharray="70 270" stroke-dashoffset="-95" transform="rotate(-90 90 80)" />
        <circle cx="90" cy="80" r="58" fill="none" stroke="#F87171" stroke-width="26" stroke-dasharray="55 270" stroke-dashoffset="-165" transform="rotate(-90 90 80)" />
        <circle cx="90" cy="80" r="58" fill="none" stroke="#86EFAC" stroke-width="26" stroke-dasharray="42 270" stroke-dashoffset="-220" transform="rotate(-90 90 80)" />
        <circle cx="90" cy="80" r="58" fill="none" stroke="#C4B5FD" stroke-width="26" stroke-dasharray="34 270" stroke-dashoffset="-262" transform="rotate(-90 90 80)" />
        <circle cx="90" cy="80" r="32" fill="#fff" />
      </svg>
    )
  },
})
export const Area = defineComponent({ name:'Area', setup(){ return () => null } })
export const XAxis = defineComponent({ name:'XAxis', setup(){ return () => null } })
export const YAxis = defineComponent({ name:'YAxis', setup(){ return () => null } })
export const CartesianGrid = defineComponent({ name:'CartesianGrid', setup(){ return () => null } })
export const Tooltip = defineComponent({ name:'Tooltip', setup(){ return () => null } })
export const LineChart = defineComponent({ name:'LineChart', setup(_, { slots }){ return () => <>{slots.default?.()}</> } })
export const Line = defineComponent({ name:'Line', setup(){ return () => null } })
export const Pie = defineComponent({ name:'Pie', setup(_, { slots }){ return () => <>{slots.default?.()}</> } })
export const Cell = defineComponent({ name:'Cell', setup(){ return () => null } })
export const Legend = defineComponent({ name:'Legend', setup(){ return () => null } })
export const Bar = defineComponent({ name:'Bar', setup(){ return () => null } })
