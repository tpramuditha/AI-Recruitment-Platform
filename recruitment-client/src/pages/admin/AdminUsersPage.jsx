import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/Admin/users');
      setUsers(response.data.users || []);
    } catch (err) {
      setError('System directory could not be reached.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Reassign target account security tier to "${newRole}"?`)) return;
    setUpdating(true);
    try {
      await apiClient.put(`/Admin/users/${userId}/role`, { role: newRole });
      await fetchUsers();
    } catch (err) {
      alert('Failed to update account authorization privileges.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently wipe this identity structure from the active database?')) return;
    setUpdating(true);
    try {
      await apiClient.delete(`/Admin/users/${userId}`);
      await fetchUsers();
    } catch (err) {
      alert('Account purging operation aborted by system.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="pf-center-loader">
        <div className="pf-spinner"></div>
        <p>Parsing directory registries...</p>
      </div>
    );
  }

  return (
    <div className="pf-view-container animate-fade-in">
      <div className="pf-header-split-row">
        <div>
          <h1 className="pf-view-title">User Management</h1>
          <p className="pf-view-subtitle">Audit workspace identities and access permissions</p>
        </div>
        <div className="pf-badge-counter">
          Total Base Accounts: <strong>{users.length}</strong>
        </div>
      </div>

      {error && <div className="pf-banner-error">{error}</div>}

      {/* Clean high-density spreadsheet grid wrapper */}
      <div className="pf-table-card">
        <table className="pf-native-table">
          <thead>
            <tr>
              <th>Profile Name</th>
              <th>Email Address</th>
              <th>System Access Role</th>
              <th>Registration Date</th>
              <th className="txt-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.id === user?.id ? 'row-highlight-self' : ''}>
                <td>
                  <div className="pf-table-identity">
                    <div className="pf-avatar-small">
                      {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="pf-identity-name">{u.fullName}</span>
                  </div>
                </td>
                <td className="pf-cell-email">{u.email}</td>
                <td>
                  <div className="pf-select-wrapper">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updating || u.id === user?.id}
                      className="pf-table-dropdown"
                    >
                      <option value="Candidate">Candidate</option>
                      <option value="Recruiter">Recruiter</option>
                      <option value="HiringManager">Hiring Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  {u.id === user?.id && <span className="pf-self-label">You</span>}
                </td>
                <td className="pf-cell-date">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="txt-center">
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={updating || u.id === user?.id}
                    className={`pf-btn-action-delete ${u.id === user?.id ? 'disabled' : ''}`}
                    title={u.id === user?.id ? 'Self deletion protected' : 'Delete user profile'}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;