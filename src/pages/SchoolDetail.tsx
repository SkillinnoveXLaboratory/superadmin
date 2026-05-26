import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { SuperAdmin } from '@/lib/api/services';
import type { School } from '@/lib/api/types';

export function SchoolDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState<null | 'suspend' | 'delete'>(null);

  const { data, isLoading, error } = useQuery<School>({
    queryKey: ['school', id], queryFn: () => SuperAdmin.getSchool(id), enabled: !!id,
  });

  const suspend = useMutation({
    mutationFn: () => SuperAdmin.toggleSuspension(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['school', id] }); qc.invalidateQueries({ queryKey: ['schools'] }); toast.success('Status updated'); setConfirming(null); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const remove = useMutation({
    mutationFn: () => SuperAdmin.deleteSchool(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schools'] }); toast.success('School deleted'); navigate('/schools', { replace: true }); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <Skeleton />;
  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-500">Couldn't load that school.</p>
        <Link to="/schools" className="btn-ghost mt-4">← Back to all schools</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/schools" className="text-sm text-ink-500 hover:text-ink-900 inline-flex items-center gap-1">
        ← All schools
      </Link>
      <header className="card p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-14 w-14 rounded-2xl bg-brand-gradient text-white grid place-items-center font-display font-bold text-lg">
            {data.name.split(/\s+/).slice(0,2).map(w=>w[0]).join('')}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-[24px] font-bold tracking-tight">{data.name}</h1>
            <p className="text-ink-500 text-sm">{data.address}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {data.status === 'ACTIVE'
              ? <span className="chip-success">●&nbsp;Active</span>
              : <span className="chip-warning">●&nbsp;Suspended</span>}
            <span className="chip-brand">{data.plan ?? 'Standard'}</span>
            <button onClick={() => setEditing(true)} className="btn-outline py-1.5 px-3 text-xs">Edit</button>
            <button onClick={() => setConfirming('suspend')} className="btn-ghost py-1.5 px-3 text-xs">
              {data.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
            </button>
            <button onClick={() => setConfirming('delete')} className="btn-ghost py-1.5 px-3 text-xs text-danger hover:bg-danger-bg">Delete</button>
          </div>
        </div>
      </header>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon="students" label="Students" value={data.studentCount ?? '—'} />
        <Stat icon="teacher"  label="Staff"    value={data.staffCount   ?? '—'} />
        <Stat icon="calendar" label="Created"  value={fmtDate(data.createdAt)} />
        <Stat icon="settings" label="Reg #"    value={data.registrationNumber} mono />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
            <Row label="Contact email" value={data.contactEmail} />
            <Row label="Contact phone" value={data.contactPhone} />
            <Row label="Registration"  value={data.registrationNumber} />
            <Row label="Status"        value={data.status} />
            <Row label="Created"       value={fmtDate(data.createdAt)} />
            <Row label="Last updated"  value={fmtDate(data.updatedAt)} />
          </dl>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <ActionRow onClick={() => toast('Coming soon — impersonation requires backend support')} icon="logout"   label="Sign in as school admin" />
            <ActionRow onClick={() => toast('Open admin web to bulk import')} icon="upload"   label="Bulk import roster" />
            <ActionRow onClick={() => toast('Generating finance export…')} icon="download" label="Export finance ledger" />
            <ActionRow onClick={() => navigate('/announcements')} icon="bell"     label="Send platform notice" />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {editing && (
          <EditSchoolModal school={data} onClose={() => setEditing(false)} onSaved={() => {
            qc.invalidateQueries({ queryKey: ['school', id] });
            qc.invalidateQueries({ queryKey: ['schools'] });
            setEditing(false);
          }}/>
        )}
        {confirming === 'suspend' && (
          <Modal title={`${data.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'} ${data.name}?`} onClose={() => setConfirming(null)}
            footer={<>
              <button onClick={() => setConfirming(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => suspend.mutate()} disabled={suspend.isPending}
                className={data.status === 'ACTIVE' ? 'btn bg-warning text-white hover:bg-warning/90' : 'btn-primary'}>
                {suspend.isPending ? 'Working…' : data.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
              </button>
            </>}>
            <p className="text-sm text-ink-500">
              {data.status === 'ACTIVE'
                ? 'Suspending freezes new sign-ins for this tenant. Existing data is preserved.'
                : 'Reactivating restores access for all users at this school.'}
            </p>
          </Modal>
        )}
        {confirming === 'delete' && (
          <Modal title={`Delete ${data.name}?`} onClose={() => setConfirming(null)}
            footer={<>
              <button onClick={() => setConfirming(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => remove.mutate()} disabled={remove.isPending}
                className="btn bg-danger text-white hover:bg-danger/90">
                {remove.isPending ? 'Deleting…' : 'Delete permanently'}
              </button>
            </>}>
            <p className="text-sm text-ink-500">Soft-deletes the tenant. Data remains recoverable for 30 days.</p>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditSchoolModal({ school, onClose, onSaved }: { school: School; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: school.name, registrationNumber: school.registrationNumber,
    contactEmail: school.contactEmail, contactPhone: school.contactPhone, address: school.address,
  });
  const save = useMutation({
    mutationFn: () => SuperAdmin.updateSchool(school.id, form),
    onSuccess: () => { toast.success('School updated'); onSaved(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <Modal title="Edit school" onClose={onClose}
      footer={<>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </>}>
      <div className="space-y-3">
        {[
          ['name', 'School name'], ['registrationNumber', 'Registration #'],
          ['contactEmail', 'Contact email'], ['contactPhone', 'Contact phone'],
          ['address', 'Address'],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="label">{label}</label>
            <input className="input mt-2" value={(form as any)[k]}
              onChange={(e) => setForm(f => ({ ...f, [k]: e.target.value }))}/>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function Stat({ icon, label, value, mono }: { icon: any; label: string; value: any; mono?: boolean }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="label">{label}</p>
        <div className="h-9 w-9 rounded-xl bg-brand-50 grid place-items-center"><Icon name={icon} className="text-brand-600" size={18}/></div>
      </div>
      <div className={`mt-3 font-display text-[22px] font-bold ${mono ? 'font-mono text-base' : ''}`}>{value}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-400 text-xs uppercase tracking-wider">{label}</dt>
      <dd className="text-ink-900 mt-0.5">{value}</dd>
    </div>
  );
}
function ActionRow({ icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm hover:bg-muted transition-colors text-left">
      <span className="inline-flex items-center gap-3">
        <span className="h-8 w-8 rounded-lg bg-brand-50 grid place-items-center text-brand-600"><Icon name={icon} size={16}/></span>
        {label}
      </span>
      <Icon name="arrow-right" size={14} className="text-ink-400" />
    </button>
  );
}
function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 bg-muted rounded-lg animate-pulse"/>
      <div className="card p-6"><div className="h-20 bg-muted rounded-xl animate-pulse"/></div>
      <div className="grid sm:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-muted rounded-2xl animate-pulse"/>)}</div>
    </div>
  );
}
function fmtDate(s?: string) { return s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'; }
