import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';

interface PlatformUser { name: string; role: string; email: string; status: 'ACTIVE' | 'INACTIVE'; }
const INITIAL: PlatformUser[] = [
  { name: 'Asha Verma',   role: 'PLATFORM_OPS', email: 'asha@schoolmate.io',  status: 'ACTIVE' },
  { name: 'Karan Mehra',  role: 'SUPPORT_LEAD', email: 'karan@schoolmate.io', status: 'ACTIVE' },
  { name: 'Lakshmi Iyer', role: 'SUPER_ADMIN',  email: 'lakshmi@schoolmate.io', status: 'ACTIVE' },
  { name: 'Rohit Saxena', role: 'BILLING',      email: 'rohit@schoolmate.io', status: 'INACTIVE' },
];

export function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(INITIAL);
  const [invite, setInvite] = useState(false);

  const toggle = (email: string) => setUsers(us => us.map(u =>
    u.email === email ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="label">Internal</p>
          <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Platform users</h1>
          <p className="text-ink-500 mt-1 text-sm">People with access to the Super Admin console.</p>
        </div>
        <button onClick={() => setInvite(true)} className="btn-primary"><Icon name="plus" size={16}/> Invite user</button>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className="table-header">User</th>
              <th className="table-header">Role</th>
              <th className="table-header">Email</th>
              <th className="table-header">Status</th>
              <th className="table-header text-right pr-6"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr key={u.email}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="hover:bg-muted/40 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-gradient text-white text-sm grid place-items-center font-semibold">
                      {u.name.split(' ').map(w=>w[0]).join('')}
                    </div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="table-cell"><span className="chip-brand font-mono">{u.role}</span></td>
                <td className="table-cell text-ink-500">{u.email}</td>
                <td className="table-cell">
                  {u.status === 'ACTIVE' ? <span className="chip-success">●&nbsp;Active</span> : <span className="chip-warning">●&nbsp;Inactive</span>}
                </td>
                <td className="table-cell text-right pr-6 space-x-2">
                  <button onClick={() => toggle(u.email)} className="btn-ghost py-1.5 px-3 text-xs">
                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button onClick={() => toast.success(`Reset link sent to ${u.email}`)} className="btn-outline py-1.5 px-3 text-xs">Reset password</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {invite && <InviteModal onClose={() => setInvite(false)} onAdd={(u) => { setUsers(us => [u, ...us]); setInvite(false); }}/>}
      </AnimatePresence>
    </div>
  );
}

function InviteModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: PlatformUser) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PLATFORM_OPS');

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd({ name, email, role, status: 'ACTIVE' });
    toast.success(`Invitation sent to ${email}`);
  }
  return (
    <Modal title="Invite a platform user" onClose={onClose}
      footer={<>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={submit} disabled={!name || !email} className="btn-primary">Send invitation</button>
      </>}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">Full name</label><input className="input mt-2" value={name} onChange={e=>setName(e.target.value)} required/></div>
        <div><label className="label">Email</label><input className="input mt-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
        <div>
          <label className="label">Role</label>
          <select className="input mt-2" value={role} onChange={e=>setRole(e.target.value)}>
            {['SUPER_ADMIN','PLATFORM_OPS','SUPPORT_LEAD','BILLING'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <p className="text-xs text-ink-400">User receives an invite email with a one-time sign-in link.</p>
      </form>
    </Modal>
  );
}
