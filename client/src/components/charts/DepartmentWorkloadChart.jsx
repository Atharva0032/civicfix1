import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartShell, ChartTooltip, truncateTick } from './ChartTooltip';

/** Departmental workload from `GET /api/admin/stats` → `byDepartment`. */
export function DepartmentWorkloadChart({ data = [], isLoading = false, height = 320 }) {
  const rows = data.map((entry) => ({ ...entry }));

  return (
    <ChartShell
      height={height}
      isLoading={isLoading}
      isEmpty={!rows.length}
      emptyLabel="No complaints have been assigned to a department yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
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
            dataKey="department"
            width={150}
            tickFormatter={(value) => truncateTick(value, 24)}
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} content={<ChartTooltip />} />
          <Bar
            dataKey="count"
            name="Assigned complaints"
            fill="#2949c4"
            radius={[0, 8, 8, 0]}
            barSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default DepartmentWorkloadChart;
