import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/Toast';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Patients     from './pages/Patients';
import Doctors      from './pages/Doctors';
import Appointments from './pages/Appointments';
import Prescriptions from './pages/Prescriptions';
import Bills        from './pages/Bills';
import Medicines    from './pages/Medicines';
import Wards        from './pages/Wards';
import Analytics    from './pages/Analytics';
import Users        from './pages/Users';

// Route guard: redirect to /login if not authenticated
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

// Route guard: redirect to /dashboard if already logged in
function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// Role guard: redirect to /dashboard if role not allowed
function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { toasts, toast, dismiss } = useToast();

  const p = (Component, roles) => (
    <RequireAuth>
      {roles
        ? <RequireRole roles={roles}><Component toast={toast} /></RequireRole>
        : <Component toast={toast} />
      }
    </RequireAuth>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/dashboard"    element={p(Dashboard)} />
        <Route path="/patients"     element={p(Patients)} />
        <Route path="/doctors"      element={p(Doctors)} />
        <Route path="/appointments" element={p(Appointments)} />
        <Route path="/prescriptions" element={p(Prescriptions)} />
        <Route path="/bills"        element={p(Bills)} />
        <Route path="/medicines"    element={p(Medicines)} />
        <Route path="/wards"        element={p(Wards)} />
        <Route path="/analytics"    element={p(Analytics, ['admin'])} />
        <Route path="/users"        element={p(Users, ['admin'])} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
