import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import { Data } from '@/lib/api/services';

export function DataOpsPage() {
  const backup = useMutation({
    mutationFn: () => Data.backup(),
    onSuccess: () => toast.success('Backup queued'),
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const cards = [
    { title: 'Trigger full backup', desc: 'Async snapshot of Mongo + S3 bucket. Email when complete.',
      icon: 'check' as const, action: () => backup.mutate(), cta: backup.isPending ? 'Queuing…' : 'Run backup' },
    { title: 'Export student roster', desc: 'XLSX across all schools. Tenant-scoped sheets per tab.',
      icon: 'download' as const, cta: 'Generate file' },
    { title: 'Export finance ledger', desc: 'Cash receipts, invoices, discounts. Year-to-date.',
      icon: 'download' as const, cta: 'Generate file' },
    { title: 'Bulk import students',  desc: 'Upload CSV or XLSX to a chosen tenant. Validates against schema.',
      icon: 'upload'   as const, cta: 'Upload file' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="label">Maintenance</p>
        <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Data operations</h1>
        <p className="text-ink-500 mt-1 text-sm">One-click platform tools. Use with care.</p>
      </header>

      <section className="grid sm:grid-cols-2 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.title} className="card p-6 group"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-50 grid place-items-center text-brand-600"><Icon name={c.icon} /></div>
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold">{c.title}</h3>
                <p className="text-sm text-ink-500 mt-1">{c.desc}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={c.action} className="btn-outline">{c.cta} <Icon name="arrow-right" size={14}/></button>
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
