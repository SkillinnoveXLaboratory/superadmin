import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/Login';
import { OverviewPage } from '@/pages/Overview';
import { SchoolsPage } from '@/pages/Schools';
import { SchoolDetailPage } from '@/pages/SchoolDetail';
import { StudentsPage } from '@/pages/Students';

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
        <Route path="students" element={<StudentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
