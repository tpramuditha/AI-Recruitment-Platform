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
    { path: '/manager', label: ' Home', icon: '🏠' },
    { path: '/manager/applications', label: ' Recent Applications', icon: '📋' },
    { path: '/manager/interviews', label: ' My Interview Schedule', icon: '📅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="manager-layout-container">
      <div className={`manager-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="manager-sidebar-header">
          <h2 className="manager-logo">
            {sidebarOpen ? '📋 Hiring Manager' : '📋'}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="manager-toggle-btn"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="manager-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`manager-nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="manager-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="manager-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="manager-sidebar-footer">
          <div className="manager-user-info">
            <div className="manager-user-avatar">
              {user?.fullName?.charAt(0) || 'M'}
            </div>
            {sidebarOpen && (
              <div>
                <div className="manager-user-name">{user?.fullName || 'Manager'}</div>
                <div className="manager-user-role">{user?.role || 'Role'}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="manager-logout-btn">
             {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      <div className={`manager-main-content ${sidebarOpen ? 'open' : 'closed'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default ManagerLayout;