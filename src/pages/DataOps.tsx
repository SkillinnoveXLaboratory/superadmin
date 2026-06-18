import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { Data } from '@/lib/api/services';

export function DataOpsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmBackup, setConfirmBackup] = useState(false);
  const [log, setLog] = useState<{ when: string; what: string; status: 'OK'|'FAIL' }[]>([]);

  const backup = useMutation({
    mutationFn: () => Data.backup(),
    onSuccess: () => { toast.success('Backup queued'); setLog(l => [{ when: new Date().toLocaleTimeString(), what: 'Backup triggered', status: 'OK' }, ...l]); setConfirmBackup(false); },
    onError:   (e: any) => { toast.error(e?.response?.data?.message || 'Failed'); setLog(l => [{ when: new Date().toLocaleTimeString(), what: 'Backup failed', status: 'FAIL' }, ...l]); },
  });

  const importStudents = useMutation({
    mutationFn: (file: File) => { const fd = new FormData(); fd.append('file', file); return Data.importStudents(fd); },
    onSuccess: () => { toast.success('Import queued — you\'ll get an email summary'); setLog(l => [{ when: new Date().toLocaleTimeString(), what: 'Bulk import started', status: 'OK' }, ...l]); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const exportStudents = useMutation({
    mutationFn: () => Data.exportStudents(),
    onSuccess: () => { toast.success('Export ready — file downloads shortly'); setLog(l => [{ when: new Date().toLocaleTimeString(), what: 'Student export', status: 'OK' }, ...l]); },
    onError:   () => toast.error('Failed'),
  });
  const exportFinance = useMutation({
    mutationFn: () => Data.exportFinance(),
    onSuccess: () => { toast.success('Export ready'); setLog(l => [{ when: new Date().toLocaleTimeString(), what: 'Finance export', status: 'OK' }, ...l]); },
    onError:   () => toast.error('Failed'),
  });

  const cards = [
    { title: 'Trigger full backup', desc: 'Async snapshot of Mongo + S3 bucket. Email when complete.',
      icon: 'check' as const, action: () => setConfirmBackup(true), cta: backup.isPending ? 'Queuing…' : 'Run backup' },
    { title: 'Export student roster', desc: 'XLSX across all schools. Tenant-scoped sheets per tab.',
      icon: 'download' as const, action: () => exportStudents.mutate(), cta: exportStudents.isPending ? 'Generating…' : 'Generate file' },
    { title: 'Export finance ledger', desc: 'Cash receipts, invoices, discounts. Year-to-date.',
      icon: 'download' as const, action: () => exportFinance.mutate(), cta: exportFinance.isPending ? 'Generating…' : 'Generate file' },
    { title: 'Bulk import students',  desc: 'Upload CSV or XLSX to a chosen tenant. Validates against schema.',
      icon: 'upload'   as const, action: () => fileRef.current?.click(), cta: importStudents.isPending ? 'Uploading…' : 'Upload file' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="label">Maintenance</p>
        <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Data operations</h1>
        <p className="text-ink-500 mt-1 text-sm">One-click platform tools. Use with care.</p>
      </header>

      <input ref={fileRef} type="file" accept=".csv,.xlsx" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importStudents.mutate(f); e.currentTarget.value = ''; }}/>

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

      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold">Activity log</h2>
        <p className="text-xs text-ink-400">Operations run from this console.</p>
        {log.length === 0 ? (
          <p className="text-sm text-ink-400 mt-4">No operations yet this session.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {log.map((row, i) => (
              <li key={i} className="py-3 flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-ink-400">{row.when}</span>
                <span className="flex-1 px-4">{row.what}</span>
                <span className={row.status === 'OK' ? 'chip-success' : 'chip-danger'}>{row.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {confirmBackup && (
          <Modal title="Trigger full backup?" onClose={() => setConfirmBackup(false)}
            footer={<>
              <button onClick={() => setConfirmBackup(false)} className="btn-ghost">Cancel</button>
              <button onClick={() => backup.mutate()} disabled={backup.isPending} className="btn-primary">
                {backup.isPending ? 'Queuing…' : 'Run backup'}
              </button>
            </>}>
            <p className="text-sm text-ink-500">Snapshot may take 10–20 minutes. You'll receive an email when it lands in S3.</p>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
