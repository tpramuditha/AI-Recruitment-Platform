import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './CandidateHomePage.css';

const CandidateHomePage = () => {
  const { user } = useAuth();

  return (
    <div className="candidate-home-container">
      <div>
        <h1 className="candidate-home-title">Welcome back, {user?.fullName} 👋</h1>
        <p className="candidate-home-subtitle">Your personalized recruitment hub</p>
      </div>

      <div className="candidate-stats-grid">
        <div className="candidate-stat-card">
          <div className="candidate-stat-icon red">💼</div>
          <div>
            <div className="candidate-stat-number">Explore Opportunities</div>
            <div className="candidate-stat-label">Find open roles</div>
          </div>
        </div>
        <div className="candidate-stat-card">
          <div className="candidate-stat-icon green">📝</div>
          <div>
            <div className="candidate-stat-number">Apply Today</div>
            <div className="candidate-stat-label">Track submission fields</div>
          </div>
        </div>
        <div className="candidate-stat-card">
          <div className="candidate-stat-icon purple">📅</div>
          <div>
            <div className="candidate-stat-number">Interview Ready</div>
            <div className="candidate-stat-label">Review your pipeline</div>
          </div>
        </div>
      </div>

      <div className="candidate-quick-actions">
        <h2 className="candidate-section-title">Quick Actions</h2>
        <div className="candidate-action-grid">
          <Link to="/candidate/jobs" className="candidate-action-card">
            <div className="candidate-action-icon">🔍</div>
            <div className="candidate-action-label">Browse Jobs</div>
          </Link>
          <Link to="/candidate/applications" className="candidate-action-card">
            <div className="candidate-action-icon">📋</div>
            <div className="candidate-action-label">My Applications</div>
          </Link>
          <Link to="/candidate/profile" className="candidate-action-card">
            <div className="candidate-action-icon">👤</div>
            <div className="candidate-action-label">Update Profile</div>
          </Link>
          <Link to="/candidate/interviews" className="candidate-action-card">
            <div className="candidate-action-icon">📅</div>
            <div className="candidate-action-label">My Interviews</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CandidateHomePage;