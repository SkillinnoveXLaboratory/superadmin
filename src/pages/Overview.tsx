import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Icon } from '@/components/Icon';
import { SuperAdmin } from '@/lib/api/services';
import type { PlatformKPIs } from '@/lib/api/types';

const fallback: PlatformKPIs = {
  totalSchools: 0,
  activeSchools: 0,
  suspendedSchools: 0,
  totalUsers: 0,
};

export function OverviewPage() {
  const { data = fallback, isLoading, error } = useQuery<PlatformKPIs>({
    queryKey: ['overview'],
    queryFn: () => SuperAdmin.overview(),
  });

  const chartData = [
    { label: 'Schools', value: data.totalSchools },
    { label: 'Active', value: data.activeSchools },
    { label: 'Suspended', value: data.suspendedSchools },
    { label: 'Users', value: data.totalUsers ?? 0 },
  ];

  const stats = [
    { label: 'Schools', value: data.totalSchools, sub: `${data.activeSchools} active · ${data.suspendedSchools} suspended`, icon: 'school', tone: 'brand' as const },
    { label: 'Active', value: data.activeSchools, sub: 'currently running', icon: 'check', tone: 'success' as const },
    { label: 'Suspended', value: data.suspendedSchools, sub: 'awaiting cleanup', icon: 'logout', tone: 'warning' as const },
    { label: 'Users', value: data.totalUsers ?? 0, sub: 'platform-wide', icon: 'parent', tone: 'info' as const },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="label">Platform overview</p>
        <h1 className="font-display text-[32px] font-bold tracking-tight mt-1">Hello, Super Admin.</h1>
        <p className="text-ink-500 mt-1.5">Live snapshot across every tenant on Schoolmate ERP.</p>
      </header>

      {error && (
        <div className="card border-warning bg-warning-bg/30 p-4 text-warning text-sm">
          Couldn&apos;t reach the API right now. Showing zeros. <span className="opacity-70">({String(error)})</span>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.2, 0, 0, 1] }}
          >
            <div className="flex items-start justify-between">
              <p className="label">{s.label}</p>
              <div className={`h-9 w-9 rounded-xl grid place-items-center ${toneBg(s.tone)}`}>
                <Icon name={s.icon as any} size={18} className={toneText(s.tone)} />
              </div>
            </div>
            <div className="mt-3 font-display text-[32px] font-bold tracking-tight">
              {isLoading ? <span className="inline-block w-16 h-7 bg-muted rounded-md animate-pulse" /> : s.value}
            </div>
            <p className="text-xs text-ink-400 mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-display text-lg font-semibold">Platform snapshot</h2>
              <p className="text-xs text-ink-400">Based on the overview API response</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="chip-brand">Schools</span>
              <span className="chip-success">Active</span>
              <span className="chip-warning">Suspended</span>
            </div>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
                <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold">Quick totals</h2>
          <p className="text-xs text-ink-400">The API currently returns these fields only.</p>
          <div className="mt-4 space-y-3">
            {chartData.map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-muted/30 px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-ink-400">{item.label}</div>
                <div className="mt-1 text-2xl font-display font-bold text-ink-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function toneBg(t: 'brand' | 'info' | 'success' | 'warning') {
  return ({ brand: 'bg-brand-50', info: 'bg-info-bg', success: 'bg-success-bg', warning: 'bg-warning-bg' })[t];
}

function toneText(t: 'brand' | 'info' | 'success' | 'warning') {
  return ({ brand: 'text-brand-600', info: 'text-info', success: 'text-success', warning: 'text-warning' })[t];
}
