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
    { path: '/admin', label: ' Home', icon: '🏠' },
    { path: '/admin/users', label: ' User Management', icon: '👥' },
    { path: '/admin/interviews', label: ' All Interviews', icon: '📅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout-container">
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <h2 className="admin-logo">
            {sidebarOpen ? '⚙️ Admin' : '⚙️'}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-toggle-btn"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div>
                <div className="admin-user-name">{user?.fullName || 'Admin'}</div>
                <div className="admin-user-role">{user?.role || 'Role'}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
             {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      <div className={`admin-main-content ${sidebarOpen ? 'open' : 'closed'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;