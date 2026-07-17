import { useAuth } from '../../context/AuthContext';
import './ManagerHomePage.css';

const ManagerHomePage = () => {
  const { user } = useAuth();

  return (
    <div className="pf-home-wrapper animate-fade-in">
      <h1 className="pf-home-title">Welcome back, {user?.fullName || 'Manager'} 👋</h1>
      <p className="pf-home-subtitle">Review candidates and manage evaluations</p>

      {/* Numerical Metric Cards Grid Row */}
      <div className="pf-stats-container">
        <div className="pf-metric-card-box">
          <div className="pf-metric-visual bg-light-blue">📋</div>
          <div>
            <div className="pf-metric-number">Review</div>
            <div className="pf-metric-label">Evaluate applications</div>
          </div>
        </div>
        <div className="pf-metric-card-box">
          <div className="pf-metric-visual bg-light-orange">📝</div>
          <div>
            <div className="pf-metric-number">Score</div>
            <div className="pf-metric-label">Submit evaluations</div>
          </div>
        </div>
        <div className="pf-metric-card-box">
          <div className="pf-metric-visual bg-light-purple">📅</div>
          <div>
            <div className="pf-metric-number">Schedule</div>
            <div className="pf-metric-label">Manage interviews</div>
          </div>
        </div>
      </div>

      {/* Quick Access Nav Grid */}
      <div className="pf-quick-actions-panel">
        <h2 className="pf-section-heading">Quick Actions</h2>
        <div className="pf-action-card-grid">
          <a href="/manager/applications" className="pf-action-interactive-card">
            <div className="pf-action-icon-wrapper">📋</div>
            <div className="pf-action-title">View Applications</div>
          </a>
          <a href="/manager/interviews" className="pf-action-interactive-card">
            <div className="pf-action-icon-wrapper">📅</div>
            <div className="pf-action-title">My Interviews</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ManagerHomePage;