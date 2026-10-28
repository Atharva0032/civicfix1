import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartShell, ChartTooltip } from './ChartTooltip';

const formatDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(date);
};

/**
 * "Complaints over time" — created vs resolved per day, straight from
 * `GET /api/admin/stats` → `timeline` (gaps already filled server-side).
 */
export function ComplaintsOverTimeChart({ data = [], isLoading = false, height = 300 }) {
  return (
    <ChartShell
      height={height}
      isLoading={isLoading}
      isEmpty={!data.length}
      emptyLabel="No activity in this period."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <defs>
            <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3562e6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3562e6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip labelFormatter={formatDay} />} />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, fontWeight: 600, color: '#475569' }}
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Reported"
            stroke="#3562e6"
            strokeWidth={2.4}
            fill="url(#createdGradient)"
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="#0d9488"
            strokeWidth={2.4}
            fill="url(#resolvedGradient)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default ComplaintsOverTimeChart;
