import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RecruiterLayout from './components/RecruiterLayout';
import CandidateLayout from './components/CandidateLayout';
import ManagerLayout from './components/ManagerLayout'; // NEW

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Recruiter Pages
import RecruiterHomePage from './pages/recruiter/RecruiterHomePage';
import RecruiterJobsPage from './pages/recruiter/RecruiterJobsPage';
import RecruiterPostJobPage from './pages/recruiter/RecruiterPostJobPage';

// Candidate Pages
import CandidateHomePage from './pages/candidate/CandidateHomePage';
import CandidateProfilePage from './pages/candidate/CandidateProfilePage';
import CandidateJobsPage from './pages/candidate/CandidateJobsPage';
import CandidateApplicationsPage from './pages/candidate/CandidateApplicationsPage';
import CandidateInterviewsPage from './pages/candidate/CandidateInterviewsPage';

// Manager Pages (NEW)
import ManagerHomePage from './pages/manager/ManagerHomePage';
import ManagerApplicationsPage from './pages/manager/ManagerApplicationsPage';
import ManagerInterviewsPage from './pages/manager/ManagerInterviewsPage';

// Admin Pages (unchanged)
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

          {/* Recruiter routes */}
          <Route path="/recruiter" element={
            <ProtectedRoute allowedRoles={['Recruiter', 'Admin']}>
              <RecruiterLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RecruiterHomePage />} />
            <Route path="jobs" element={<RecruiterJobsPage />} />
            <Route path="post-job" element={<RecruiterPostJobPage />} />
          </Route>

          {/* Candidate routes */}
          <Route path="/candidate" element={
            <ProtectedRoute allowedRoles={['Candidate']}>
              <CandidateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CandidateHomePage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
            <Route path="jobs" element={<CandidateJobsPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="interviews" element={<CandidateInterviewsPage />} />
          </Route>

          {/* Manager routes */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['HiringManager']}>
              <ManagerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ManagerHomePage />} />
            <Route path="applications" element={<ManagerApplicationsPage />} />
            <Route path="interviews" element={<ManagerInterviewsPage />} />
          </Route>

          {/* Admin route (unchanged) */}
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