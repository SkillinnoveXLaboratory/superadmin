import { useAuthStore } from '@/lib/stores/auth';
import { Icon } from '@/components/Icon';

export function SettingsPage() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="label">You</p>
        <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Settings</h1>
        <p className="text-ink-500 mt-1 text-sm">Manage your profile and security.</p>
      </header>

      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-brand-gradient text-white grid place-items-center text-xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{user?.firstName} {user?.lastName}</div>
            <div className="text-sm text-ink-500">{user?.email} · <span className="chip-brand font-mono">{user?.role}</span></div>
          </div>
        </div>
        <hr className="border-line"/>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name"   value={user?.firstName ?? ''} />
          <Field label="Last name"    value={user?.lastName ?? ''} />
          <Field label="Username"     value={user?.username ?? ''} />
          <Field label="Phone"        value={user?.phone ?? ''} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost">Reset</button>
          <button className="btn-primary"><Icon name="check" size={14}/> Save changes</button>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-base font-semibold">Security</h2>
        <p className="text-sm text-ink-500 mt-1">Sessions, MFA, recovery codes.</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <ActionTile label="Change password"     desc="Update your sign-in password." />
          <ActionTile label="Two-factor auth"     desc="Authenticator app, TOTP."     badge="Recommended" />
          <ActionTile label="Active sessions"     desc="Sign out from other devices." />
        </div>
      </section>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input defaultValue={value} className="input mt-2" />
    </div>
  );
}
function ActionTile({ label, desc, badge }: { label: string; desc: string; badge?: string }) {
  return (
    <button className="text-left p-4 rounded-xl border border-line bg-surface hover:border-brand-300 hover:bg-brand-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">{label}</div>
        {badge && <span className="chip-success text-[10px]">{badge}</span>}
      </div>
      <p className="text-xs text-ink-500 mt-1">{desc}</p>
    </button>
  );
}
