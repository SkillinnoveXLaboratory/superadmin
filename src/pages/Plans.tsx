import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';

const PLANS = [
  { name: 'Starter',      price: 4_999,  per: 'school / mo', features: ['Up to 500 students','Cash payments','Attendance + Exams','Email support'], tier: 'soft' as const },
  { name: 'Professional', price: 12_999, per: 'school / mo', features: ['Up to 3,000 students','RFID + biometric','HR & payroll','Transport routing','Priority support'], tier: 'brand' as const, popular: true },
  { name: 'Enterprise',   price: 'Custom', per: 'multi-tenant', features: ['Unlimited students','Dedicated SLA','Custom integrations','SAML SSO','24×7 phone'], tier: 'dark' as const },
];

export function PlansPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="label">Monetization</p>
        <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Plans & billing</h1>
        <p className="text-ink-500 mt-1 text-sm">Configure which feature tiers are exposed to school admins.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-5">
        {PLANS.map((p, i) => (
          <motion.div key={p.name}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`relative card p-6 flex flex-col ${p.tier === 'dark' ? 'bg-ink-900 text-white border-ink-900' : ''} ${p.popular ? 'ring-2 ring-brand-500/40 shadow-pop' : ''}`}>
            {p.popular && (
              <span className="absolute top-4 right-4 chip-brand">Most popular</span>
            )}
            <h3 className="font-display text-xl font-bold tracking-tight">{p.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[36px] font-bold tracking-tight">
                {typeof p.price === 'number' ? `₹${p.price.toLocaleString()}` : p.price}
              </span>
              <span className={`text-sm ${p.tier === 'dark' ? 'text-white/60' : 'text-ink-400'}`}>/ {p.per}</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm flex-1">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className={`h-5 w-5 rounded-full grid place-items-center mt-0.5 ${p.tier === 'dark' ? 'bg-white/10' : 'bg-success-bg text-success'}`}>
                    <Icon name="check" size={12} />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button className={`mt-6 w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 ease-springy active:scale-[0.98]
                              ${p.tier === 'dark' ? 'bg-white text-ink-900 hover:bg-white/90'
                                : p.popular     ? 'bg-brand-gradient text-white shadow-pop-40'
                                                : 'border border-line bg-surface text-ink-900 hover:border-brand-300 hover:bg-brand-50'}`}>
              {p.popular ? 'Set as default' : 'Edit plan'}
            </button>
          </motion.div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold">Billing pipeline</h2>
        <p className="text-sm text-ink-500">Pending invoices and renewal cohort by month.</p>
        <div className="grid sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Renewing this month', value: 47,  tone: 'brand'   },
            { label: 'Past due',             value:  3,  tone: 'danger'  },
            { label: 'Upgrades pending',     value: 12,  tone: 'success' },
            { label: 'Cancelled (last 30d)', value:  2,  tone: 'warning' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-ink-400 uppercase tracking-wider">{s.label}</p>
              <p className="font-display text-[28px] font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
