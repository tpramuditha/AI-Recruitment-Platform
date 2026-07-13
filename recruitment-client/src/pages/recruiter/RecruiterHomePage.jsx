import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import './RecruiterHomePage.css'; // We'll create this next

const RecruiterHomePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    totalInterviews: 0,
    recentApplications: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const jobsRes = await apiClient.get('/Jobs');
      const jobs = jobsRes.data;

      let allApplications = [];
      for (const job of jobs) {
        const appsRes = await apiClient.get(`/Applications/job/${job.id}`);
        allApplications = [...allApplications, ...appsRes.data];
      }

      const interviewsRes = await apiClient.get('/Interviews/calendar');

      setStats({
        totalJobs: jobs.length,
        totalApplications: allApplications.length,
        totalInterviews: interviewsRes.data?.length || 0,
        recentApplications: allApplications.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const colors = {
      'Submitted': '#2196f3',
      'UnderReview': '#ff9800',
      'Shortlisted': '#4caf50',
      'Rejected': '#f44336',
      'Hired': '#1b5e20',
    };
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
      backgroundColor: colors[status] || '#999',
      color: '#fff',
      marginLeft: '8px',
    };
  };

  if (loading) {
    return <div className="recruiter-loading-spinner">Loading dashboard...</div>;
  }

  return (
    <div className="recruiter-home-container">
      <h1 className="recruiter-home-title">Welcome back, {user?.fullName} 👋</h1>
      <p className="recruiter-home-subtitle">Here's what's happening with your job postings</p>

      <div className="recruiter-stats-grid">
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon">💼</div>
          <div>
            <div className="recruiter-stat-number">{stats.totalJobs}</div>
            <div className="recruiter-stat-label">Total Jobs Posted</div>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon">📝</div>
          <div>
            <div className="recruiter-stat-number">{stats.totalApplications}</div>
            <div className="recruiter-stat-label">Total Applications</div>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon">📅</div>
          <div>
            <div className="recruiter-stat-number">{stats.totalInterviews}</div>
            <div className="recruiter-stat-label">Total Interviews</div>
          </div>
        </div>
      </div>

      <div className="recruiter-recent-section">
        <h2 className="recruiter-section-title">Recent Applications</h2>
        {stats.recentApplications.length === 0 ? (
          <p className="recruiter-no-data">No applications yet. Post a job to get started!</p>
        ) : (
          <div className="recruiter-app-list">
            {stats.recentApplications.map((app, index) => (
              <div key={index} className="recruiter-app-item">
                <div>
                  <strong>{app.candidateName || 'Unknown'}</strong>
                  <span className="recruiter-app-email">{app.candidateEmail || ''}</span>
                </div>
                <div>
                  <span className="recruiter-app-job">{app.jobTitle || 'Unknown Job'}</span>
                  <span style={getStatusBadgeStyle(app.status)}>{app.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="recruiter-quick-actions">
        <h2 className="recruiter-section-title">Quick Actions</h2>
        <div className="recruiter-action-grid">
          <a href="/recruiter/post-job" className="recruiter-action-card">
            <div className="recruiter-action-icon">➕</div>
            <div className="recruiter-action-label">Post New Job</div>
          </a>
          <a href="/recruiter/jobs" className="recruiter-action-card">
            <div className="recruiter-action-icon">📋</div>
            <div className="recruiter-action-label">View All Jobs</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default RecruiterHomePage;