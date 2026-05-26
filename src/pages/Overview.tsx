import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from 'recharts';
import { Icon } from '@/components/Icon';
import { SuperAdmin } from '@/lib/api/services';
import type { PlatformKPIs } from '@/lib/api/types';

const fallback: PlatformKPIs = {
  totalSchools: 0, activeSchools: 0, suspendedSchools: 0,
  totalStudents: 0, totalStaff: 0, monthlyRevenue: 0,
  trend: [], topSchools: [],
};

export function OverviewPage() {
  const { data = fallback, isLoading, error } = useQuery<PlatformKPIs>({
    queryKey: ['overview'],
    queryFn: () => SuperAdmin.overview(),
  });

  const stats = [
    { label: 'Schools',  value: data.totalSchools, sub: `${data.activeSchools} active · ${data.suspendedSchools} suspended`, icon: 'school',   tone: 'brand'   as const },
    { label: 'Students', value: data.totalStudents, sub: 'across all tenants',                                                icon: 'students', tone: 'info'    as const },
    { label: 'Staff',    value: data.totalStaff,    sub: 'platform-wide',                                                     icon: 'teacher',  tone: 'success' as const },
    { label: 'MRR',      value: `₹${(data.monthlyRevenue / 1000).toFixed(1)}K`, sub: 'this month',                              icon: 'finance',  tone: 'warning' as const },
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
          Couldn't reach the API right now. Showing zeros. <span className="opacity-70">({String(error)})</span>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label} className="stat-card"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
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
              <h2 className="font-display text-lg font-semibold">Revenue & enrollment</h2>
              <p className="text-xs text-ink-400">Last 12 months</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="chip-brand">Revenue</span>
              <span className="chip-success">Students</span>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend.length ? data.trend : sampleTrend}>
                <defs>
                  <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="stu" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.32}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
                <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue"  stroke="#4F46E5" strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="students" stroke="#10B981" strokeWidth={2.5} fill="url(#stu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold">Top schools</h2>
          <p className="text-xs text-ink-400">By active students</p>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data.topSchools.length ? data.topSchools : sampleTop).slice(0, 5)} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={12} stroke="#475569" width={120} />
                <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="students" fill="#4F46E5" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function toneBg(t: 'brand'|'info'|'success'|'warning') {
  return ({brand:'bg-brand-50',info:'bg-info-bg',success:'bg-success-bg',warning:'bg-warning-bg'})[t];
}
function toneText(t: 'brand'|'info'|'success'|'warning') {
  return ({brand:'text-brand-600',info:'text-info',success:'text-success',warning:'text-warning'})[t];
}

const sampleTrend = [
  { month: 'Jun', revenue: 240, students: 1820 },
  { month: 'Jul', revenue: 305, students: 1940 },
  { month: 'Aug', revenue: 330, students: 2010 },
  { month: 'Sep', revenue: 410, students: 2210 },
  { month: 'Oct', revenue: 425, students: 2280 },
  { month: 'Nov', revenue: 470, students: 2340 },
  { month: 'Dec', revenue: 488, students: 2360 },
  { month: 'Jan', revenue: 520, students: 2455 },
  { month: 'Feb', revenue: 548, students: 2520 },
  { month: 'Mar', revenue: 596, students: 2610 },
  { month: 'Apr', revenue: 612, students: 2680 },
  { month: 'May', revenue: 660, students: 2745 },
];
const sampleTop = [
  { id: '1', name: 'Greenwood High',  students: 2_180, revenue: 0 },
  { id: '2', name: 'Vidyaranya Public', students: 1_960, revenue: 0 },
  { id: '3', name: 'Inventure Academy', students: 1_540, revenue: 0 },
  { id: '4', name: 'Oakridge Intl.',    students: 1_310, revenue: 0 },
  { id: '5', name: 'Delhi Public',      students: 1_180, revenue: 0 },
];
