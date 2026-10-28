import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, RefreshCw } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '../../components/ui';
import { DepartmentWorkloadChart } from '../../components/charts';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMeta } from '../../context/MetaContext';
import api from '../../lib/api';
import { formatNumber, percent } from '../../lib/format';

function ResolutionBar({ value }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Resolution rate"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safe)}
      >
        <div
          className="h-full rounded-full bg-accent-500 transition-all duration-500"
          style={{ width: `${safe}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-xs font-bold text-navy-800">{percent(safe)}</span>
    </div>
  );
}

export default function AdminDepartmentsPage() {
  useDocumentTitle('Departments');

  const { departments, categories } = useMeta();
  const statsRequest = useApi('/admin/stats', { params: { days: 90 } });

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const list = departments ?? [];
    if (!list.length) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        list.map(async (department) => {
          const [all, resolved] = await Promise.all([
            api.get('/admin/issues', { params: { department, limit: 1 } }),
            api.get('/admin/issues', {
              params: { department, status: 'resolved', limit: 1 },
            }),
          ]);
          return {
            department,
            total: all.data.meta?.total ?? 0,
            resolved: resolved.data.meta?.total ?? 0,
          };
        }),
      );
      setRows(results);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [departments]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryLabelsFor = (department) =>
    categories
      .filter((category) => category.department === department)
      .map((category) => category.label);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
            Departments
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Each complaint category is automatically routed to a municipal department. Track the
            workload and throughput of every team here.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={RefreshCw}
          onClick={load}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Department workload"
          description="Complaints assigned to each department over the last 90 days"
        />
        <CardBody>
          <DepartmentWorkloadChart
            data={statsRequest.data?.byDepartment ?? []}
            isLoading={statsRequest.isLoading}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Department performance"
          description="Assigned volume, resolved count and resolution rate"
        />
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={7} columns={5} />
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorState
                title="Department metrics could not be loaded"
                message={error.message}
                onRetry={load}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Building2}
                title="No departments configured"
                description="Departments will appear here once the municipal metadata is available."
              />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th scope="col" className="px-5 py-3">
                        Department
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Categories served
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Assigned
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Resolved
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Resolution rate
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const labels = categoryLabelsFor(row.department);
                      const rate = row.total ? (row.resolved / row.total) * 100 : 0;
                      return (
                        <tr
                          key={row.department}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-2.5 font-semibold text-navy-900">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
                                <Building2 className="h-4 w-4" aria-hidden="true" />
                              </span>
                              {row.department}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {labels.length ? (
                                labels.map((label) => (
                                  <span
                                    key={label}
                                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    {label}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-navy-900">
                            {formatNumber(row.total)}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                            {formatNumber(row.resolved)}
                          </td>
                          <td className="px-5 py-4">
                            <ResolutionBar value={rate} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              as={Link}
                              to={`/admin/issues?department=${encodeURIComponent(
                                row.department,
                              )}`}
                              variant="outline"
                              size="xs"
                              rightIcon={ArrowRight}
                            >
                              View complaints
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 lg:hidden">
                {rows.map((row) => {
                  const labels = categoryLabelsFor(row.department);
                  const rate = row.total ? (row.resolved / row.total) * 100 : 0;
                  return (
                    <li key={row.department} className="p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
                          <Building2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="font-semibold text-navy-900">{row.department}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {labels.length ? (
                          labels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                            >
                              {label}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No categories mapped</span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Assigned</p>
                          <p className="font-bold text-navy-900">{formatNumber(row.total)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Resolved</p>
                          <p className="font-semibold text-emerald-700">
                            {formatNumber(row.resolved)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <ResolutionBar value={rate} />
                      </div>

                      <Button
                        as={Link}
                        to={`/admin/issues?department=${encodeURIComponent(row.department)}`}
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        rightIcon={ArrowRight}
                      >
                        View complaints
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
