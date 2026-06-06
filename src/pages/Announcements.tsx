import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';
import { Communication } from '@/lib/api/services';

export function AnnouncementsPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery<any[]>({
    queryKey: ['announcements'],
    queryFn: () => Communication.announcements.list() as Promise<any[]>,
  });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'ALL'|'ADMIN'|'TEACHER'|'PARENT'>('ALL');

  const send = useMutation({
    mutationFn: () => Communication.announcements.create({ title, body, audience }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Posted'); setTitle(''); setBody(''); },
    onError:   (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function submit(e: FormEvent) { e.preventDefault(); send.mutate(); }

  return (
    <div className="space-y-6">
      <header>
        <p className="label">Platform-wide</p>
        <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Announcements</h1>
        <p className="text-ink-500 mt-1 text-sm">Broadcast to all schools or a specific audience.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.form onSubmit={submit} className="card p-6 space-y-4 lg:col-span-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <label className="label">Title</label>
            <input className="input mt-2" required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Maintenance window on Saturday"/>
          </div>
          <div>
            <label className="label">Body</label>
            <textarea className="input mt-2 min-h-[120px]" required value={body} onChange={e=>setBody(e.target.value)} placeholder="Schoolmate ERP will be unavailable for 30 minutes…"/>
          </div>
          <div>
            <label className="label">Audience</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(['ALL','ADMIN','TEACHER','PARENT'] as const).map(a => (
                <button key={a} type="button" onClick={() => setAudience(a)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${audience === a ? 'bg-brand-gradient text-white' : 'bg-muted text-ink-500 hover:text-ink-900'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full"><Icon name="announcement" size={16}/> Publish</button>
        </motion.form>

        <div className="lg:col-span-3 space-y-3">
          {items.length === 0
            ? <div className="card p-6 text-center text-ink-500 text-sm">No announcements yet. Send your first one →</div>
            : items.map((a, i) => (
                <motion.article key={i} className="card p-5"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold">{a.title}</h3>
                      <p className="text-sm text-ink-500 mt-1.5">{a.body}</p>
                    </div>
                    <span className="chip-brand">{a.audience ?? 'ALL'}</span>
                  </div>
                </motion.article>
              ))
          }
        </div>
      </div>
    </div>
  );
}
