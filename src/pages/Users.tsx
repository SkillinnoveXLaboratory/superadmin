import { Icon } from '@/components/Icon';

const SAMPLE = [
  { name: 'Asha Verma',     role: 'PLATFORM_OPS', email: 'asha@schoolmate.io',  status: 'ACTIVE' },
  { name: 'Karan Mehra',    role: 'SUPPORT_LEAD', email: 'karan@schoolmate.io', status: 'ACTIVE' },
  { name: 'Lakshmi Iyer',   role: 'SUPER_ADMIN',  email: 'lakshmi@schoolmate.io', status: 'ACTIVE' },
  { name: 'Rohit Saxena',   role: 'BILLING',      email: 'rohit@schoolmate.io', status: 'INACTIVE' },
];

export function UsersPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="label">Internal</p>
          <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Platform users</h1>
          <p className="text-ink-500 mt-1 text-sm">People with access to the Super Admin console.</p>
        </div>
        <button className="btn-primary"><Icon name="plus" size={16}/> Invite user</button>
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
            {SAMPLE.map(u => (
              <tr key={u.email} className="hover:bg-muted/40 transition-colors">
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
                <td className="table-cell text-right pr-6">
                  <button className="btn-ghost py-1.5 px-3 text-xs">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
