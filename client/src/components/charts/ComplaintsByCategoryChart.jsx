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
import { CATEGORY_STYLES } from '../../lib/constants';
import { useMeta } from '../../context/MetaContext';
import { ChartShell, ChartTooltip } from './ChartTooltip';

/**
 * "Complaints by category" — values come straight from
 * `GET /api/admin/stats` → `byCategory`.
 */
export function ComplaintsByCategoryChart({ data = [], isLoading = false, height = 300 }) {
  const { categoryLabel } = useMeta();
  const rows = data.map((entry) => ({
    ...entry,
    label: categoryLabel(entry.category),
    fill: CATEGORY_STYLES[entry.category]?.accent || '#3562e6',
  }));

  return (
    <ChartShell
      height={height}
      isLoading={isLoading}
      isEmpty={!rows.length}
      emptyLabel="No complaints have been filed yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
            content={<ChartTooltip />}
          />
          <Bar dataKey="count" name="Complaints" radius={[0, 8, 8, 0]} barSize={18}>
            {rows.map((row) => (
              <Cell key={row.category} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default ComplaintsByCategoryChart;
