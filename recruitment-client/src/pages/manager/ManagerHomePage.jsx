import { useAuth } from '../../context/AuthContext';
import './ManagerHomePage.css';

const ManagerHomePage = () => {
  const { user } = useAuth();

  return (
    <div className="manager-home-container">
      <h1 className="manager-home-title">Welcome back, {user?.fullName} 👋</h1>
      <p className="manager-home-subtitle">Review candidates and manage evaluations</p>

      <div className="manager-stats-grid">
        <div className="manager-stat-card">
          <div className="manager-stat-icon">📋</div>
          <div>
            <div className="manager-stat-number">Review</div>
            <div className="manager-stat-label">Evaluate applications</div>
          </div>
        </div>
        <div className="manager-stat-card">
          <div className="manager-stat-icon">📝</div>
          <div>
            <div className="manager-stat-number">Score</div>
            <div className="manager-stat-label">Submit evaluations</div>
          </div>
        </div>
        <div className="manager-stat-card">
          <div className="manager-stat-icon">📅</div>
          <div>
            <div className="manager-stat-number">Schedule</div>
            <div className="manager-stat-label">Manage interviews</div>
          </div>
        </div>
      </div>

      <div className="manager-quick-actions">
        <h2 className="manager-section-title">Quick Actions</h2>
        <div className="manager-action-grid">
          <a href="/manager/applications" className="manager-action-card">
            <div className="manager-action-icon">📋</div>
            <div className="manager-action-label">View Applications</div>
          </a>
          <a href="/manager/interviews" className="manager-action-card">
            <div className="manager-action-icon">📅</div>
            <div className="manager-action-label">My Interviews</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ManagerHomePage;