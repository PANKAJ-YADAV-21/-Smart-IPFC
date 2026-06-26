import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplicationWizard from './pages/ApplicationWizard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffReviewWizard from './pages/StaffReviewWizard';
import VerifyEmail from './pages/VerifyEmail';
import AccessDenied from './pages/AccessDenied';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center text-white bg-[#0f172a]">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Email Verification Guard
  if (user && user.email_verified_at === null) {
    return <Navigate to="/verify-email" replace />;
  }

  if (roles && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />;

  return children;
};

const HomeRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center text-white bg-[#0f172a]">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
  // client or any other verified role → client dashboard
  return <Navigate to="/dashboard/overview" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Root → smart role-based redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Application Wizard — declared BEFORE the wildcard /dashboard/* */}
          <Route
            path="/dashboard/applications/new"
            element={
              <ProtectedRoute roles={['client']}>
                <ApplicationWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/applications/edit/:id"
            element={
              <ProtectedRoute roles={['client']}>
                <ApplicationWizard />
              </ProtectedRoute>
            }
          />

          {/* Client Dashboard — wildcard catches all /dashboard/* sub-tabs */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute roles={['client']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Staff Verification Desk */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute roles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/review/:id"
            element={
              <ProtectedRoute roles={['staff']}>
                <StaffReviewWizard />
              </ProtectedRoute>
            }
          />

          {/* Admin Executive Console */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
