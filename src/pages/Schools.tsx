import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Icon } from '@/components/Icon';
import { Lottie } from '@/components/Lottie';
import { SuperAdmin } from '@/lib/api/services';
import type { School } from '@/lib/api/types';

export function SchoolsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'ALL'|'ACTIVE'|'SUSPENDED'>('ALL');
  const [open, setOpen] = useState(false);

  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<School[]>({
    queryKey: ['schools', q, status],
    queryFn: () => SuperAdmin.listSchools({
      search: q || undefined,
      status: status === 'ALL' ? undefined : status,
      limit: 100,
    }),
  });

  const filtered = useMemo(() => data, [data]);

  const suspend = useMutation({
    mutationFn: (id: string) => SuperAdmin.toggleSuspension(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schools'] }); toast.success('Status updated'); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label">Tenants</p>
          <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Schools</h1>
          <p className="text-ink-500 mt-1 text-sm">{filtered.length} tenant{filtered.length === 1 ? '' : 's'} on the platform.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Icon name="plus" size={16}/> Register school
        </button>
      </header>

      <div className="card p-4 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search by name, registration #, contact email…"
            className="input pl-9" />
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          {(['ALL','ACTIVE','SUSPENDED'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={clsx('px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
                status === s ? 'bg-surface shadow-soft text-ink-900' : 'text-ink-500 hover:text-ink-900')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <SchoolsSkeleton />
        ) : filtered.length === 0 ? (
          <Empty onCreate={() => setOpen(true)} />
        ) : (
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <th className="table-header">School</th>
                <th className="table-header">Registration</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/40 transition-colors group">
                  <td className="table-cell">
                    <Link to={`/schools/${s.id}`} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-gradient text-white grid place-items-center font-semibold text-sm">
                        {initials(s.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">{s.name}</div>
                        <div className="text-xs text-ink-400">{s.address}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="table-cell font-mono text-xs">{s.registrationNumber}</td>
                  <td className="table-cell">
                    <div className="text-ink-900 text-[13px]">{s.contactEmail}</div>
                    <div className="text-ink-400 text-xs">{s.contactPhone}</div>
                  </td>
                  <td className="table-cell">
                    <span className="chip-brand">{s.plan ?? 'Standard'}</span>
                  </td>
                  <td className="table-cell">
                    {s.status === 'ACTIVE'
                      ? <span className="chip-success">●&nbsp;Active</span>
                      : <span className="chip-warning">●&nbsp;Suspended</span>}
                  </td>
                  <td className="table-cell text-right pr-6 space-x-2">
                    <button onClick={() => suspend.mutate(s.id)} className="btn-ghost py-1.5 px-3 text-xs">
                      {s.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                    <Link to={`/schools/${s.id}`} className="btn-outline py-1.5 px-3 text-xs">
                      Open <Icon name="arrow-right" size={12}/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {open && <CreateSchoolModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-16 grid place-items-center text-center">
      <Lottie src="/lottie/empty-quiet.json" className="w-44" />
      <h3 className="font-display text-lg font-semibold mt-2">No schools yet</h3>
      <p className="text-ink-500 text-sm max-w-sm mt-1">Onboard your first tenant to start collecting cash payments, attendance, and exam results.</p>
      <button onClick={onCreate} className="btn-primary mt-5"><Icon name="plus" size={16}/> Register school</button>
    </div>
  );
}

function SchoolsSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 bg-muted/60 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function CreateSchoolModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', registrationNumber: '', contactEmail: '', contactPhone: '', address: '' });
  const create = useMutation({
    mutationFn: (data: typeof form) => SuperAdmin.createSchool(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schools'] }); toast.success('School registered'); onClose(); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  function submit(e: FormEvent) { e.preventDefault(); create.mutate(form); }

  return (
    <motion.div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm grid place-items-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form onSubmit={submit} onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-lg card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Register a new school</h2>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-900 text-xl leading-none">×</button>
        </div>
        <Field label="School name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
        <Field label="Registration number" value={form.registrationNumber} onChange={v => setForm(f => ({ ...f, registrationNumber: v }))} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact email" type="email" value={form.contactEmail} onChange={v => setForm(f => ({ ...f, contactEmail: v }))} required />
          <Field label="Contact phone" value={form.contactPhone} onChange={v => setForm(f => ({ ...f, contactPhone: v }))} required />
        </div>
        <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={create.isPending} className="btn-primary">
            {create.isPending ? 'Saving…' : 'Register'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, value, onChange, type='text', required }: { label: string; value: string; onChange: (v: string)=>void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)} className="input mt-2" />
    </div>
  );
}

function initials(s: string) {
  return s.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
