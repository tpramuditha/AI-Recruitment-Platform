import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import './AdminHomePage.css';

const AdminHomePage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/Admin/dashboard');
      setDashboard(response.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="admin-home-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="admin-home-error">{error}</div>;
  }

  return (
    <div className="admin-home-container">
      <h1 className="admin-home-title">Welcome back, {user?.fullName} 👋</h1>
      <p className="admin-home-subtitle">System overview and analytics</p>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>Users</h3>
          <p className="admin-stat-number">{dashboard?.users?.total || 0}</p>
          <div className="admin-stat-details">
            <span>👤 Candidates: {dashboard?.users?.byRole?.Candidate || 0}</span>
            <span>👔 Recruiters: {dashboard?.users?.byRole?.Recruiter || 0}</span>
            <span>📋 Managers: {dashboard?.users?.byRole?.HiringManager || 0}</span>
            <span>⚙️ Admins: {dashboard?.users?.byRole?.Admin || 0}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <h3>Jobs</h3>
          <p className="admin-stat-number">{dashboard?.jobs?.total || 0}</p>
          <div className="admin-stat-details">
            <span>✅ Active: {dashboard?.jobs?.active || 0}</span>
            <span>❌ Inactive: {dashboard?.jobs?.inactive || 0}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <h3>Applications</h3>
          <p className="admin-stat-number">{dashboard?.applications?.total || 0}</p>
          <div className="admin-stat-details">
            <span>📩 Submitted: {dashboard?.applications?.byStatus?.Submitted || 0}</span>
            <span>🔍 Review: {dashboard?.applications?.byStatus?.UnderReview || 0}</span>
            <span>⭐ Shortlisted: {dashboard?.applications?.byStatus?.Shortlisted || 0}</span>
            <span>❌ Rejected: {dashboard?.applications?.byStatus?.Rejected || 0}</span>
            <span>🎉 Hired: {dashboard?.applications?.byStatus?.Hired || 0}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <h3>Interviews</h3>
          <p className="admin-stat-number">{dashboard?.interviews?.total || 0}</p>
          <div className="admin-stat-details">
            <span>📅 Scheduled: {dashboard?.interviews?.byStatus?.Scheduled || 0}</span>
            <span>✅ Completed: {dashboard?.interviews?.byStatus?.Completed || 0}</span>
            <span>❌ Cancelled: {dashboard?.interviews?.byStatus?.Cancelled || 0}</span>
          </div>
        </div>
      </div>

      <div className="admin-recent-activity">
        <h2 className="admin-section-title">Recent Activity (Last 7 Days)</h2>
        <div className="admin-activity-grid">
          <div className="admin-activity-item">
            <span className="admin-activity-icon">👤</span>
            <span>New Users: {dashboard?.recentActivity?.newUsers || 0}</span>
          </div>
          <div className="admin-activity-item">
            <span className="admin-activity-icon">💼</span>
            <span>New Jobs: {dashboard?.recentActivity?.newJobs || 0}</span>
          </div>
          <div className="admin-activity-item">
            <span className="admin-activity-icon">📝</span>
            <span>New Applications: {dashboard?.recentActivity?.newApplications || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;