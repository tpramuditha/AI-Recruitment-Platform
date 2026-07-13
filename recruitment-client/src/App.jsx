import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RecruiterLayout from './components/RecruiterLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Recruiter Pages
import RecruiterHomePage from './pages/recruiter/RecruiterHomePage';
import RecruiterJobsPage from './pages/recruiter/RecruiterJobsPage';
import RecruiterPostJobPage from './pages/recruiter/RecruiterPostJobPage';

// Other Portal Pages
import CandidatePortalPage from './pages/candidate/CandidatePortalPage';
import ManagerPortalPage from './pages/manager/ManagerPortalPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Recruiter routes with sidebar layout */}
          <Route path="/recruiter" element={
            <ProtectedRoute allowedRoles={['Recruiter', 'Admin']}>
              <RecruiterLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RecruiterHomePage />} />
            <Route path="jobs" element={<RecruiterJobsPage />} />
            <Route path="post-job" element={<RecruiterPostJobPage />} />
          </Route>

          {/* Other routes */}
          <Route path="/candidate" element={
            <ProtectedRoute allowedRoles={['Candidate']}>
              <CandidatePortalPage />
            </ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['HiringManager']}>
              <ManagerPortalPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminPortalPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;