import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AIGenerator } from './pages/AIGenerator';
import { Users } from './pages/Users';
import { Schools } from './pages/Schools';
import { Monitoring } from './pages/Monitoring';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { UserRole } from './types';
import { useEffect } from 'react';
import { Clock, XCircle } from 'lucide-react';
import { logout } from './firebase';
import { Button } from './components/ui/Button';

const AuthRedirectHandler = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate, location]);

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (profile && profile.status === 'PENDING') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="mb-6 h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <Clock size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Menunggu Persetujuan</h1>
        <p className="text-slate-600 max-w-md mb-8">
          Akun Anda telah berhasil dibuat dan sedang menunggu tinjauan dari Super Admin. 
          Silakan hubungi administrator sekolah Anda atau periksa kembali nanti.
        </p>
        <Button onClick={() => logout()} variant="outline">Keluar</Button>
      </div>
    );
  }

  if (profile && profile.status === 'REJECTED') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="mb-6 h-20 w-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <XCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Ditolak</h1>
        <p className="text-slate-600 max-w-md mb-8">
          Mohon maaf, permintaan pendaftaran akun Anda telah ditolak oleh administrator.
        </p>
        <Button onClick={() => logout()} variant="outline">Keluar</Button>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};

const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: UserRole[] 
}) => {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthRedirectHandler />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* AI Generator - All Roles */}
                  <Route path="/ai-generator" element={<AIGenerator />} />
                  <Route path="/ai-generator/:type" element={<AIGenerator />} />
                  
                  {/* Admin Only Routes */}
                  <Route path="/schools" element={
                    <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_SEKOLAH']}>
                      <Schools />
                    </RoleProtectedRoute>
                  } />
                  <Route path="/users" element={
                    <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_SEKOLAH']}>
                      <Users />
                    </RoleProtectedRoute>
                  } />
                  <Route path="/users/monitoring" element={
                    <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_SEKOLAH']}>
                      <Monitoring />
                    </RoleProtectedRoute>
                  } />

                  {/* Shared Routes */}
                  <Route path="/journals" element={<div className="p-8">Halaman Jurnal (Coming Soon)</div>} />
                  <Route path="/attendance" element={<div className="p-8">Halaman Absensi (Coming Soon)</div>} />
                  <Route path="/grading" element={<div className="p-8">Halaman Penilaian (Coming Soon)</div>} />
                  <Route path="/calendar" element={<div className="p-8">Halaman Kalender (Coming Soon)</div>} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
