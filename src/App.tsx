import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BottomNav } from './components/BottomNav';
import { Login } from './pages/Login';
import { DashboardHome, TourismDashboard, TourismReport } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { AuditLog } from './pages/AuditLog';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: Array<'ADMIN' | 'PETUGAS'> }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="pb-28">
                <DashboardHome />
                <BottomNav />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wisata/input"
          element={
            <ProtectedRoute><RoleRoute roles={['PETUGAS']}><TourismReport /></RoleRoute></ProtectedRoute>
          }
        />
        <Route
          path="/wisata/laporan"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['ADMIN']}>
                <div className="pb-28">
                  <TourismDashboard />
                  <BottomNav />
                </div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div className="pb-28">
                <Settings />
                <BottomNav />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute><RoleRoute roles={['ADMIN']}>
              <div className="pb-28">
                <AuditLog />
                <BottomNav />
              </div>
            </RoleRoute></ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
