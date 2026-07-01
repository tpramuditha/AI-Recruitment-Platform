// src/pages/admin/AdminPortalPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const AdminPortalPage = () => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        apiClient.get('/Admin/dashboard'),
        apiClient.get('/Admin/users')
      ]);
      setDashboard(dashboardRes.data);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    
    setUpdating(true);
    try {
      await apiClient.put(`/Admin/users/${userId}/role`, { role: newRole });
      await fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to update role.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setUpdating(true);
    try {
      await apiClient.delete(`/Admin/users/${userId}`);
      await fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to delete user.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Portal</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.fullName} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Dashboard Stats */}
      {dashboard && (
        <section style={styles.section}>
          <h2>Dashboard Overview</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3>Users</h3>
              <p style={styles.statNumber}>{dashboard.users?.total || 0}</p>
              <div style={styles.statDetails}>
                <span>👤 Candidates: {dashboard.users?.byRole?.Candidate || 0}</span>
                <span>👔 Recruiters: {dashboard.users?.byRole?.Recruiter || 0}</span>
                <span>📋 Managers: {dashboard.users?.byRole?.HiringManager || 0}</span>
                <span>⚙️ Admins: {dashboard.users?.byRole?.Admin || 0}</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <h3>Jobs</h3>
              <p style={styles.statNumber}>{dashboard.jobs?.total || 0}</p>
              <div style={styles.statDetails}>
                <span>✅ Active: {dashboard.jobs?.active || 0}</span>
                <span>❌ Inactive: {dashboard.jobs?.inactive || 0}</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <h3>Applications</h3>
              <p style={styles.statNumber}>{dashboard.applications?.total || 0}</p>
              <div style={styles.statDetails}>
                <span>📩 Submitted: {dashboard.applications?.byStatus?.Submitted || 0}</span>
                <span>🔍 Review: {dashboard.applications?.byStatus?.UnderReview || 0}</span>
                <span>⭐ Shortlisted: {dashboard.applications?.byStatus?.Shortlisted || 0}</span>
                <span>❌ Rejected: {dashboard.applications?.byStatus?.Rejected || 0}</span>
                <span>🎉 Hired: {dashboard.applications?.byStatus?.Hired || 0}</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <h3>Interviews</h3>
              <p style={styles.statNumber}>{dashboard.interviews?.total || 0}</p>
              <div style={styles.statDetails}>
                <span>📅 Scheduled: {dashboard.interviews?.byStatus?.Scheduled || 0}</span>
                <span>✅ Completed: {dashboard.interviews?.byStatus?.Completed || 0}</span>
                <span>❌ Cancelled: {dashboard.interviews?.byStatus?.Cancelled || 0}</span>
              </div>
            </div>
          </div>

          <div style={styles.recentActivity}>
            <h4>Recent Activity (Last 7 Days)</h4>
            <p>👤 New Users: {dashboard.recentActivity?.newUsers || 0}</p>
            <p>💼 New Jobs: {dashboard.recentActivity?.newJobs || 0}</p>
            <p>📝 New Applications: {dashboard.recentActivity?.newApplications || 0}</p>
          </div>
        </section>
      )}

      {/* User Management */}
      <section style={styles.section}>
        <h2>User Management</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={updating || u.id === user?.id}
                    style={styles.roleSelect}
                  >
                    <option value="Candidate">Candidate</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="HiringManager">Hiring Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {u.id === user?.id && <span style={styles.selfTag}>(you)</span>}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={updating || u.id === user?.id}
                    style={u.id === user?.id ? styles.deleteBtnDisabled : styles.deleteBtn}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #eee', marginBottom: '24px' },
  title: { margin: 0, color: '#1a1a2e' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoutBtn: { padding: '6px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  section: { marginBottom: '40px' },
  error: { padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '16px' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', fontFamily: 'sans-serif' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' },
  statCard: { padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' },
  statNumber: { fontSize: '32px', fontWeight: 'bold', margin: '8px 0', color: '#1a1a2e' },
  statDetails: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: '#555' },
  recentActivity: { padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f5f5f5' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  roleSelect: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' },
  selfTag: { fontSize: '12px', color: '#666', marginLeft: '6px' },
  deleteBtn: { padding: '4px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  deleteBtnDisabled: { padding: '4px 12px', backgroundColor: '#ccc', color: '#666', border: 'none', borderRadius: '4px', cursor: 'not-allowed' },
};

export default AdminPortalPage;