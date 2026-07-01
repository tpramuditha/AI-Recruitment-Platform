// src/routes.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CandidatePortalPage from './pages/candidate/CandidatePortalPage';
import RecruiterPortalPage from './pages/recruiter/RecruiterPortalPage';
import ManagerPortalPage from './pages/manager/ManagerPortalPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Protected Route component
export const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Role-based redirect after login
export const getRedirectPath = (role) => {
  switch (role) {
    case 'Candidate':
      return '/candidate';
    case 'Recruiter':
      return '/recruiter';
    case 'HiringManager':
      return '/manager';
    case 'Admin':
      return '/admin';
    default:
      return '/login';
  }
};

// Router configuration
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/candidate',
    element: (
      <ProtectedRoute roles={['Candidate']}>
        <CandidatePortalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recruiter',
    element: (
      <ProtectedRoute roles={['Recruiter']}>
        <RecruiterPortalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/manager',
    element: (
      <ProtectedRoute roles={['HiringManager']}>
        <ManagerPortalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['Admin']}>
        <AdminPortalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);