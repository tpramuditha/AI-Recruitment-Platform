import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ManagerLayout.css';

const ManagerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/manager', label: 'Dashboard', icon: '📊' },
    { path: '/manager/applications', label: 'Recent Applications', icon: '💼' },
    { path: '/manager/interviews', label: 'Interview Calendar', icon: '📅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'M';

  return (
    <div className="pf-layout-container">
      {/* Premium Dark Navigation Sidebar */}
      <aside className={`pf-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="pf-sidebar-header">
          <h2 className="pf-logo">
            <span className="logo-accent">BH</span>
            {sidebarOpen && <span className="logo-text">Best Hire</span>}
          </h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="pf-toggle-btn" aria-label="Toggle Navigation">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="pf-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`pf-nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="pf-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="pf-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="pf-sidebar-footer">
          <div className="pf-user-info">
            <div className="pf-user-avatar">{initial}</div>
            {sidebarOpen && (
              <div className="pf-user-meta animate-fade-in">
                <div className="pf-user-name">{user?.fullName || 'Manager Test'}</div>
                <div className="pf-user-role">Hiring Manager</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="pf-logout-btn">
            🔑 {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Viewport Core Area */}
      <div className={`pf-main-content ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Fixed Header Workspace Banner */}
        <header className="pf-top-bar">
          <div className="pf-workspace-title">Manager Space</div>
          <div className="pf-top-actions">
            <span className="pf-notify-bell">🔔</span>
            <span className="pf-profile-tag">{user?.fullName?.toLowerCase() || 'manager'}</span>
          </div>
        </header>

        <main className="pf-page-render-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;