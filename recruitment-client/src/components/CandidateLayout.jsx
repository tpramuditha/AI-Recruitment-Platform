import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CandidateLayout.css';

const CandidateLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/candidate', label: '🏠 Home', icon: '🏠' },
    { path: '/candidate/profile', label: '👤 My Profile', icon: '👤' },
    { path: '/candidate/jobs', label: '💼 Available Jobs', icon: '💼' },
    { path: '/candidate/applications', label: '📝 My Applications', icon: '📝' },
    { path: '/candidate/interviews', label: '📅 My Interviews', icon: '📅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="candidate-layout-container">
      <div className={`candidate-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="candidate-sidebar-header">
          <h2 className="candidate-logo">
            {sidebarOpen ? '👤 Candidate' : '👤'}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="candidate-toggle-btn"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="candidate-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`candidate-nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="candidate-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="candidate-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="candidate-sidebar-footer">
          <div className="candidate-user-info">
            <div className="candidate-user-avatar">
              {user?.fullName?.charAt(0) || 'C'}
            </div>
            {sidebarOpen && (
              <div>
                <div className="candidate-user-name">{user?.fullName || 'Candidate'}</div>
                <div className="candidate-user-role">{user?.role || 'Role'}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="candidate-logout-btn">
            🚪 {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      <div className={`candidate-main-content ${sidebarOpen ? 'open' : 'closed'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default CandidateLayout;