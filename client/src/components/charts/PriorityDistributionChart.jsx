import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMeta } from '../../context/MetaContext';
import { ChartShell, ChartTooltip } from './ChartTooltip';

/** Amber → rose ramp that matches the priority chips used across the UI. */
const PRIORITY_FILL = {
  low: '#94a3b8',
  medium: '#0ea5e9',
  high: '#f97316',
  urgent: '#e11d48',
};

/** Priority mix from `GET /api/admin/stats` → `byPriority`. */
export function PriorityDistributionChart({ data = [], isLoading = false, height = 300 }) {
  const { priorityLabel } = useMeta();

  const order = ['low', 'medium', 'high', 'urgent'];
  const rows = [...data]
    .sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority))
    .map((entry) => ({
      ...entry,
      label: priorityLabel(entry.priority),
      fill: PRIORITY_FILL[entry.priority] || '#3562e6',
    }));

  return (
    <ChartShell
      height={height}
      isLoading={isLoading}
      isEmpty={!rows.length}
      emptyLabel="No complaints to summarise yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} content={<ChartTooltip />} />
          <Bar dataKey="count" name="Complaints" radius={[8, 8, 0, 0]} barSize={44}>
            {rows.map((row) => (
              <Cell key={row.priority} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default PriorityDistributionChart;
