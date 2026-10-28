import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { STATUS_STYLES } from '../../lib/constants';
import { useMeta } from '../../context/MetaContext';
import { ChartShell, ChartTooltip } from './ChartTooltip';

/** Status mix donut built from `GET /api/admin/stats` → `byStatus`. */
export function StatusDistributionChart({ data = [], isLoading = false, height = 300 }) {
  const { statusLabel } = useMeta();

  const rows = data
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      ...entry,
      label: statusLabel(entry.status),
      fill: STATUS_STYLES[entry.status]?.marker || '#64748b',
    }));

  const total = rows.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <ChartShell
      height={height}
      isLoading={isLoading}
      isEmpty={!rows.length}
      emptyLabel="No complaints to summarise yet."
    >
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="label"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {rows.map((row) => (
                <Cell key={row.status} fill={row.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={40}
              iconType="circle"
              wrapperStyle={{ fontSize: 12, fontWeight: 600, color: '#475569' }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
          <p className="font-display text-2xl font-extrabold text-navy-900">{total}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Complaints
          </p>
        </div>
      </div>
    </ChartShell>
  );
}

export default StatusDistributionChart;
