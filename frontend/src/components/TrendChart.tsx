import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

interface SingleProps {
  data: { date: string; value: number }[]
  keyword: string
}

export function SingleTrendChart({ data, keyword }: SingleProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={v => v.slice(5)}
        />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip
          formatter={(v: number) => [`${v}`, keyword]}
          labelFormatter={l => `날짜: ${l}`}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={COLORS[0]}
          strokeWidth={2}
          dot={false}
          name={keyword}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface ComparisonProps {
  data: Record<string, number | string>[]
  keywords: string[]
}

export function ComparisonTrendChart({ data, keywords }: ComparisonProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={v => String(v).slice(5)}
        />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip labelFormatter={l => `날짜: ${l}`} />
        <Legend />
        {keywords.map((kw, i) => (
          <Line
            key={kw}
            type="monotone"
            dataKey={kw}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
