import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RecruiterLayout.css';

const RecruiterLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/recruiter', label: 'Dashboard', icon: '📊' },
    { path: '/recruiter/jobs', label: 'Job Openings', icon: '💼' },
    { path: '/recruiter/post-job', label: 'Post New Job', icon: '➕' },
    { path: '/recruiter/calendar', label: 'Interview Calendar', icon: '📅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="best-hire-layout-container">
      {/* Sidebar */}
      <aside className={`best-hire-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="best-hire-sidebar-header">
          <div className="best-hire-logo-group">
            <div className="best-hire-logo-icon">B</div>
            {sidebarOpen && <span className="best-hire-logo-text">Best Hire</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="best-hire-toggle-btn"
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        <nav className="best-hire-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`best-hire-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="best-hire-nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="best-hire-nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="best-hire-sidebar-footer">
          <div className="best-hire-user-info">
            <div className="best-hire-user-avatar">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="best-hire-user-details">
                <div className="best-hire-user-name">{user?.fullName || 'Recruiter'}</div>
                <div className="best-hire-user-role">Recruiting Team</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="best-hire-logout-btn" title="Logout">
            <span className="logout-icon">🚪</span>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className={`best-hire-main-workspace ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Top Header Row */}
        <header className="best-hire-top-header">
          <div className="header-left">
            <span className="header-breadcrumb">Recruiter Space</span>
          </div>
          <div className="header-right">
            <div className="header-notification">🔔</div>
            <div className="header-divider"></div>
            <span className="header-user-display">{user?.fullName || 'User'}</span>
          </div>
        </header>

        <main className="best-hire-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RecruiterLayout;