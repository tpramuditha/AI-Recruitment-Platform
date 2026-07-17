import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/interviews', label: 'Interview Calendar', icon: '📅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nameInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A';

  return (
    <div className="pf-admin-container">
      {/* Dynamic Animated Premium Sidebar */}
      <aside className={`pf-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="pf-sidebar-header">
          <h2 className="pf-logo">
            <span className="logo-accent">BH</span>
            {sidebarOpen && <span className="logo-text">Best Hire</span>}
          </h2>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="pf-toggle-btn" 
            aria-label="Toggle Navigation"
          >
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
            <div className="pf-user-avatar">{nameInitial}</div>
            {sidebarOpen && (
              <div className="pf-user-meta animate-fade-in">
                <div className="pf-user-name">{user?.fullName || 'Administrator'}</div>
                <div className="pf-user-role">{user?.role || 'Admin'}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="pf-logout-btn">
            🔑 {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Viewport Content Block Area */}
      <div className={`pf-main-content ${sidebarOpen ? 'open' : 'closed'}`}>
        <header className="pf-top-bar">
          <div className="pf-workspace-title">System Administration</div>
          <div className="pf-top-actions">
            <span className="pf-notify-bell">🔔</span>
            <span className="pf-profile-tag">System Live</span>
          </div>
        </header>

        <main className="pf-page-render-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;