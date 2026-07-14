import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import './CandidateApplicationsPage.css';

const CandidateApplicationsPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/Applications/my');
      setApplications(response.data);
    } catch (err) {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusBadgeStyle = (status) => {
    const colors = {
      'Submitted': '#2196f3',
      'UnderReview': '#ff9800',
      'Shortlisted': '#4caf50',
      'Rejected': '#f44336',
      'Hired': '#1b5e20',
    };
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: colors[status] || '#999',
      color: '#fff',
    };
  };

  if (loading) {
    return <div className="candidate-applications-loading">Loading applications...</div>;
  }

  return (
    <div className="candidate-applications-container">
      <h1 className="candidate-applications-title">My Applications</h1>

      {error && <div className="candidate-applications-error">{error}</div>}

      {applications.length === 0 ? (
        <p>You haven't applied to any jobs yet.</p>
      ) : (
        <table className="candidate-applications-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Department</th>
              <th>Applied Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.jobTitle || 'Unknown'}</td>
                <td>{app.jobDepartment || 'N/A'}</td>
                <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                <td>
                  <span style={getStatusBadgeStyle(app.status)}>
                    {app.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CandidateApplicationsPage;