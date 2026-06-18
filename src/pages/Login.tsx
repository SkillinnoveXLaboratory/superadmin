import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Lottie } from '@/components/Lottie';
import { SuperAdmin } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth';

const schoolHero = '/lottie/school-hero.json';

export function LoginPage() {
  const { token, loginSuccess } = useAuthStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (token) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { token, refreshToken, user } = await SuperAdmin.login({ email, password });
      loginSuccess(token, refreshToken, user);
      toast.success(`Welcome back, ${user.firstName}`);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      {/* Left — hero */}
      <div className="relative hidden lg:flex flex-col p-10 overflow-hidden text-white"
           style={{ background: 'radial-gradient(120% 80% at 0% 0%, #6D6BFB 0%, #4F46E5 35%, #312E81 100%)' }}>
        <div className="relative z-10 flex items-center justify-between">
          <Logo mark="light" />
          <a href="https://schoolmate.digitalleadpro.com" className="text-sm/none text-white/70 hover:text-white">
            Visit website →
          </a>
        </div>
        <div className="relative z-10 mt-auto">
          <Lottie src={schoolHero} className="w-72 mx-auto opacity-95" />
          <h1 className="font-display text-[40px] leading-[1.1] tracking-tight font-bold mt-6">
            The control room<br /> for every school on Schoolmate.
          </h1>
          <p className="mt-4 text-white/80 text-[15px] max-w-md">
            One sign-in. Every tenant. Real-time analytics, plan management, and platform-wide announcements.
          </p>
          <div className="mt-8 flex gap-2 flex-wrap">
            {['Multi-tenant','Stateless','100k concurrent','Cash + invoices','RFID + biometric'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur border border-white/15">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div aria-hidden className="absolute -bottom-20 -right-20 w-[480px] h-[480px] rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-8"><Logo /></div>
          <h2 className="font-display text-[28px] font-bold tracking-tight">Sign in to Super Admin</h2>
          <p className="text-ink-500 mt-2 text-sm">Use your platform-owner credentials.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input mt-2" autoFocus required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@schoolmate.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input mt-2" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full h-11 mt-2">
              {submitting ? 'Signing in…' : (<>Continue <Icon name="arrow-right" size={16} /></>)}
            </button>

            <p className="text-center text-xs text-ink-400 mt-2">
              Trouble signing in? Contact <a href="mailto:support@schoolmate.io" className="text-brand-600 font-medium">support@schoolmate.io</a>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
