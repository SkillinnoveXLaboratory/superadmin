import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Icon } from '@/components/Icon';
import { Lottie } from '@/components/Lottie';
import { Modal } from '@/components/Modal';
import { SuperAdmin } from '@/lib/api/services';
import type { SchoolListItem } from '@/lib/api/types';

type FilterStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED';

type SchoolForm = {
  name: string;
  registrationNumber: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
};

const emptyForm: SchoolForm = {
  name: '',
  registrationNumber: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
};

export function SchoolsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<FilterStatus>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const qc = useQueryClient();

  const schoolsQuery = useQuery({
    queryKey: ['schools', q, status],
    queryFn: () =>
      SuperAdmin.listSchools({
        search: q || undefined,
        status: status === 'ALL' ? undefined : status,
        limit: 1000,
      }),
  });

  const schools = schoolsQuery.data?.schools ?? [];
  const total = schoolsQuery.data?.meta.total ?? schools.length;

  const suspend = useMutation({
    mutationFn: (args: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      SuperAdmin.suspendSchool(args.id),
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success(variables.status === 'SUSPENDED' ? 'School unsuspended' : 'School suspended');
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to suspend school'),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label">Tenants</p>
          <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Schools</h1>
          <p className="text-ink-500 mt-1 text-sm">
            {total} tenant{total === 1 ? '' : 's'} on the platform.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setCreateOpen(true);
          }}
          className="btn-primary"
          type="button"
        >
          <Icon name="plus" size={16} /> Register school
        </button>
      </header>

      <div className="card p-4 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, registration #, contact email…"
            className="input pl-9"
          />
        </div>
        <div className="flex bg-muted p-1 rounded-xl overflow-x-auto max-w-full">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap',
                status === s
                  ? 'bg-surface shadow-soft text-ink-900'
                  : 'text-ink-500 hover:text-ink-900',
              )}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {schoolsQuery.isLoading ? (
          <SchoolsSkeleton />
        ) : schools.length === 0 ? (
          <Empty onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-muted/60">
                <tr>
                  <th className="table-header">School</th>
                  <th className="table-header">Registration</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created</th>
                  <th className="table-header text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="table-cell">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-brand-gradient text-white grid place-items-center font-semibold text-sm shrink-0">
                          {initials(s.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors truncate">
                            {s.name}
                          </div>
                          <div className="text-xs text-ink-400 truncate">{s.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{s.registrationNumber}</td>
                    <td className="table-cell">
                      <div className="text-ink-900 text-[13px] truncate max-w-[220px]">{s.contactEmail}</div>
                      <div className="text-ink-400 text-xs">{s.contactPhone}</div>
                    </td>
                    <td className="table-cell">
                      {s.status === 'ACTIVE' ? (
                        <span className="chip-success">● Active</span>
                      ) : (
                        <span className="chip-warning">● Suspended</span>
                      )}
                    </td>
                    <td className="table-cell text-ink-500 text-sm">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="table-cell text-right pr-6 space-x-2">
                      <button
                        onClick={() => {
                          setCreateOpen(false);
                          setEditingId(s.id);
                        }}
                        className="btn-outline py-1.5 px-3 text-xs"
                        type="button"
                      >
                        Edit
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => suspend.mutate({ id: s.id, status: s.status })}
                          className="btn-ghost py-1.5 px-3 text-xs"
                          type="button"
                          disabled={suspend.isPending}
                        >
                          Suspend
                        </button>
                      )}
                      {s.status === 'SUSPENDED' && (
                        <button
                          onClick={() => suspend.mutate({ id: s.id, status: s.status })}
                          className="btn-ghost py-1.5 px-3 text-xs"
                          type="button"
                          disabled={suspend.isPending}
                        >
                          Unsuspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {createOpen && (
          <SchoolModal
            title="Register a new school"
            schoolId={null}
            onClose={() => setCreateOpen(false)}
          />
        )}
        {editingId && (
          <SchoolModal
            title="Edit school"
            schoolId={editingId}
            onClose={() => setEditingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-16 grid place-items-center text-center">
      <Lottie src="/lottie/empty-quiet.json" className="w-44" />
      <h3 className="font-display text-lg font-semibold mt-2">No schools yet</h3>
      <p className="text-ink-500 text-sm max-w-sm mt-1">
        Onboard your first tenant to start collecting cash payments, attendance, and exam results.
      </p>
      <button onClick={onCreate} className="btn-primary mt-5" type="button">
        <Icon name="plus" size={16} /> Register school
      </button>
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

function SchoolModal({
  title,
  schoolId,
  onClose,
}: {
  title: string;
  schoolId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = Boolean(schoolId);

  const schoolQuery = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => SuperAdmin.getSchool(schoolId as string),
    enabled: isEdit,
  });
  const currentStatus = schoolQuery.data?.status ?? 'ACTIVE';

  const [form, setForm] = useState<SchoolForm>(emptyForm);

  useEffect(() => {
    if (schoolQuery.data) {
      setForm({
        name: schoolQuery.data.name ?? '',
        registrationNumber: schoolQuery.data.registrationNumber ?? '',
        address: schoolQuery.data.address ?? '',
        contactEmail: schoolQuery.data.contactEmail ?? '',
        contactPhone: schoolQuery.data.contactPhone ?? '',
      });
    } else if (!isEdit) {
      setForm(emptyForm);
    }
  }, [schoolQuery.data, isEdit]);

  const save = useMutation({
    mutationFn: (payload: SchoolForm) => {
      if (schoolId) return SuperAdmin.updateSchool(schoolId, payload);
      return SuperAdmin.createSchool(payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success(schoolId ? 'School updated' : 'School registered');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save school'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => SuperAdmin.deleteSchool(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success('School tenant suspended and queued for cleanup.');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete school'),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => SuperAdmin.suspendSchool(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success(currentStatus === 'SUSPENDED' ? 'School unsuspended' : 'School suspended');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to suspend school'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate(form);
  }

  const footer = (
    <>
      {isEdit && (
        <>
          <button
            type="button"
            onClick={() => {
              if (!schoolId) return;
              if (window.confirm('Delete this school tenant?')) remove.mutate(schoolId);
            }}
            className="btn-ghost text-danger text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0"
            disabled={remove.isPending}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => {
              if (!schoolId) return;
              const action = currentStatus === 'SUSPENDED' ? 'Unsuspend' : 'Suspend';
              if (window.confirm(`${action} this school tenant?`)) suspend.mutate(schoolId);
            }}
            className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0"
            disabled={suspend.isPending}
          >
            {currentStatus === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
          </button>
        </>
      )}
      <button type="button" onClick={onClose} className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0">
        Cancel
      </button>
      <button type="submit" form="school-form" disabled={save.isPending} className="btn-primary text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0">
        {save.isPending ? 'Saving…' : schoolId ? 'Save changes' : 'Register'}
      </button>
    </>
  );

  return (
    <Modal title={title} onClose={onClose} footer={footer} size="lg">
      {isEdit && schoolQuery.isLoading ? (
        <div className="py-8 space-y-3">
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
        </div>
      ) : (
        <form id="school-form" onSubmit={submit} className="space-y-4">
          {isEdit && schoolQuery.data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailField label="School ID" value={schoolQuery.data.id} />
              <DetailField label="Status" value={schoolQuery.data.status} />
              <DetailField label="Created" value={formatDateTime(schoolQuery.data.createdAt)} />
              <DetailField label="Updated" value={formatDateTime(schoolQuery.data.updatedAt)} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <Field label="School name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
            <Field
              label="Registration number"
              value={form.registrationNumber}
              onChange={(v) => setForm((f) => ({ ...f, registrationNumber: v }))}
              required
            />
            <Field label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Contact email"
                type="email"
                value={form.contactEmail}
                onChange={(v) => setForm((f) => ({ ...f, contactEmail: v }))}
                required
              />
              <Field
                label="Contact phone"
                value={form.contactPhone}
                onChange={(v) => setForm((f) => ({ ...f, contactPhone: v }))}
                required
              />
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-2"
      />
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-muted/30 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className="text-sm font-medium text-ink-900 mt-1 break-all">{value || '—'}</div>
    </div>
  );
}

function initials(s: string) {
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatDate(value: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
