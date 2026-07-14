import { useAuth } from '../../context/AuthContext';
import './CandidateHomePage.css';

const CandidateHomePage = () => {
  const { user } = useAuth();

  return (
    <div className="candidate-home-container">
      <h1 className="candidate-home-title">Welcome back, {user?.fullName} 👋</h1>
      <p className="candidate-home-subtitle">Your recruitment journey starts here</p>

      <div className="candidate-stats-grid">
        <div className="candidate-stat-card">
          <div className="candidate-stat-icon">💼</div>
          <div>
            <div className="candidate-stat-number">Find Jobs</div>
            <div className="candidate-stat-label">Browse available positions</div>
          </div>
        </div>
        <div className="candidate-stat-card">
          <div className="candidate-stat-icon">📝</div>
          <div>
            <div className="candidate-stat-number">Apply</div>
            <div className="candidate-stat-label">Submit your applications</div>
          </div>
        </div>
        <div className="candidate-stat-card">
          <div className="candidate-stat-icon">📅</div>
          <div>
            <div className="candidate-stat-number">Track</div>
            <div className="candidate-stat-label">Follow your interviews</div>
          </div>
        </div>
      </div>

      <div className="candidate-quick-actions">
        <h2 className="candidate-section-title">Quick Actions</h2>
        <div className="candidate-action-grid">
          <a href="/candidate/jobs" className="candidate-action-card">
            <div className="candidate-action-icon">🔍</div>
            <div className="candidate-action-label">Browse Jobs</div>
          </a>
          <a href="/candidate/applications" className="candidate-action-card">
            <div className="candidate-action-icon">📋</div>
            <div className="candidate-action-label">My Applications</div>
          </a>
          <a href="/candidate/profile" className="candidate-action-card">
            <div className="candidate-action-icon">👤</div>
            <div className="candidate-action-label">Update Profile</div>
          </a>
          <a href="/candidate/interviews" className="candidate-action-card">
            <div className="candidate-action-icon">📅</div>
            <div className="candidate-action-label">My Interviews</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CandidateHomePage;