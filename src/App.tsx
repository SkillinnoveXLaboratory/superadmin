import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/Login';
import { OverviewPage } from '@/pages/Overview';
import { SchoolsPage } from '@/pages/Schools';
import { SchoolDetailPage } from '@/pages/SchoolDetail';
import { PlansPage } from '@/pages/Plans';
import { UsersPage } from '@/pages/Users';
import { AnnouncementsPage } from '@/pages/Announcements';
import { DataOpsPage } from '@/pages/DataOps';
import { SettingsPage } from '@/pages/Settings';

function Protected({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="schools" element={<SchoolsPage />} />
        <Route path="schools/:id" element={<SchoolDetailPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="data" element={<DataOpsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
