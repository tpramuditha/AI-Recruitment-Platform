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
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;

    setUpdating(true);
    try {
      await apiClient.put(`/Admin/users/${userId}/role`, { role: newRole });
      await fetchUsers();
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
      await fetchUsers();
    } catch (err) {
      alert('Failed to delete user.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="admin-users-loading">Loading users...</div>;
  }

  return (
    <div className="admin-users-container">
      <h1 className="admin-users-title">User Management</h1>
      <p className="admin-users-subtitle">Manage user accounts and roles</p>

      {error && <div className="admin-users-error">{error}</div>}

      <div className="admin-users-stats">
        Total Users: <strong>{users.length}</strong>
      </div>

      <div className="admin-users-table-wrapper">
        <table className="admin-users-table">
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
                    className="admin-role-select"
                  >
                    <option value="Candidate">Candidate</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="HiringManager">Hiring Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {u.id === user?.id && <span className="admin-self-tag">(you)</span>}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={updating || u.id === user?.id}
                    className={u.id === user?.id ? 'admin-delete-btn-disabled' : 'admin-delete-btn'}
                  >
                    Delete
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