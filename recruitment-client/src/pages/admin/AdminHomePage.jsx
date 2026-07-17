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
      setError('System details failed to populate.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className="pf-center-loader">
        <div className="pf-spinner"></div>
        <p>Syncing telemetry indices...</p>
      </div>
    );
  }

  if (error) return <div className="pf-banner-error">⚠️ {error}</div>;

  return (
    <div className="pf-view-container animate-fade-in">
      <h1 className="pf-view-title">Welcome back, {user?.fullName || 'Admin'} 👋</h1>
      <p className="pf-view-subtitle">System metrics control deck</p>

      {/* Flat Clean Metric Cards Grid */}
      <div className="pf-stats-grid">
        <div className="pf-metric-box">
          <div className="pf-box-top">
            <span className="pf-box-label">Users Profile Pool</span>
            <span className="pf-icon-badge">👥</span>
          </div>
          <div className="pf-big-stat">{dashboard?.users?.total || 0}</div>
          <div className="pf-meta-inline-list">
            <span>Cand: <strong>{dashboard?.users?.byRole?.Candidate || 0}</strong></span>
            <span>Rec: <strong>{dashboard?.users?.byRole?.Recruiter || 0}</strong></span>
            <span>Mgr: <strong>{dashboard?.users?.byRole?.HiringManager || 0}</strong></span>
          </div>
        </div>

        <div className="pf-metric-box">
          <div className="pf-box-top">
            <span className="pf-box-label">Active Vacancies</span>
            <span className="pf-icon-badge">💼</span>
          </div>
          <div className="pf-big-stat">{dashboard?.jobs?.total || 0}</div>
          <div className="pf-meta-inline-list">
            <span className="txt-success">Active: {dashboard?.jobs?.active || 0}</span>
            <span className="txt-muted">Inactive: {dashboard?.jobs?.inactive || 0}</span>
          </div>
        </div>

        <div className="pf-metric-box">
          <div className="pf-box-top">
            <span className="pf-box-label">Applications Pipeline</span>
            <span className="pf-icon-badge">📋</span>
          </div>
          <div className="pf-big-stat">{dashboard?.applications?.total || 0}</div>
          <div className="pf-meta-inline-list">
            <span>Sub: {dashboard?.applications?.byStatus?.Submitted || 0}</span>
            <span>Rev: {dashboard?.applications?.byStatus?.UnderReview || 0}</span>
            <span>Hire: {dashboard?.applications?.byStatus?.Hired || 0}</span>
          </div>
        </div>

        <div className="pf-metric-box">
          <div className="pf-box-top">
            <span className="pf-box-label">Interviews Scheduled</span>
            <span className="pf-icon-badge">📅</span>
          </div>
          <div className="pf-big-stat">{dashboard?.interviews?.total || 0}</div>
          <div className="pf-meta-inline-list">
            <span>Sched: {dashboard?.interviews?.byStatus?.Scheduled || 0}</span>
            <span>Comp: {dashboard?.interviews?.byStatus?.Completed || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Log Activity Card Block */}
      <div className="pf-activity-panel">
        <h3 className="pf-panel-heading">Recent Activity <span className="pf-sub-tag">7 days timeline</span></h3>
        <div className="pf-activity-row-layout">
          <div className="pf-activity-pill">
            <span className="pf-pill-emoji">👤</span>
            <div>
              <div className="pf-pill-number">{dashboard?.recentActivity?.newUsers || 0}</div>
              <div className="pf-pill-label">New Users Created</div>
            </div>
          </div>
          <div className="pf-activity-pill">
            <span className="pf-pill-emoji">💼</span>
            <div>
              <div className="pf-pill-number">{dashboard?.recentActivity?.newJobs || 0}</div>
              <div className="pf-pill-label">New Roles Posted</div>
            </div>
          </div>
          <div className="pf-activity-pill">
            <span className="pf-pill-emoji">📝</span>
            <div>
              <div className="pf-pill-number">{dashboard?.recentActivity?.newApplications || 0}</div>
              <div className="pf-pill-label">New Applications</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;