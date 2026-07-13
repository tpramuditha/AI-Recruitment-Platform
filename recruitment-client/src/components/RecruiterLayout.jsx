import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RecruiterLayout.css'; // We'll create this next

const RecruiterLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/recruiter', label: '🏠 Home', icon: '🏠' },
    { path: '/recruiter/jobs', label: '💼 Your Jobs', icon: '💼' },
    { path: '/recruiter/post-job', label: '➕ Post New Job', icon: '➕' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="recruiter-layout-container">
      {/* Sidebar */}
      <div className={`recruiter-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="recruiter-sidebar-header">
          <h2 className="recruiter-logo">
            {sidebarOpen ? '🎯 Recruiter' : '🎯'}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="recruiter-toggle-btn"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="recruiter-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`recruiter-nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="recruiter-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="recruiter-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="recruiter-sidebar-footer">
          <div className="recruiter-user-info">
            <div className="recruiter-user-avatar">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div>
                <div className="recruiter-user-name">{user?.fullName || 'User'}</div>
                <div className="recruiter-user-role">{user?.role || 'Role'}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="recruiter-logout-btn">
            🚪 {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`recruiter-main-content ${sidebarOpen ? 'open' : 'closed'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default RecruiterLayout;