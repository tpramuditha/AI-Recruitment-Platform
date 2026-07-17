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

  const getStatusBadgeClass = (status) => {
  const map = {
    'Submitted': 'badge-submitted',
    'UnderReview': 'badge-review',
    'Shortlisted': 'badge-shortlisted',
    'Rejected': 'badge-rejected',
    'Hired': 'badge-hired',
  };
  return `best-hire-badge ${map[status] || 'badge-default'}`;
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
        // inside return block instead of <table>
        <div className="best-hire-table-wrapper">
          <table className="candidate-applications-table">
            <thead>
              <tr>
                <th>Job Opening</th>
                <th>Department</th>
                <th>Applied Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td><span className="table-job-bold">{app.jobTitle || 'Unknown'}</span></td>
                  <td><span className="table-text-muted">{app.jobDepartment || 'N/A'}</span></td>
                  <td><span className="table-text-muted">{new Date(app.appliedAt).toLocaleDateString()}</span></td>
                  <td>
                    <span className={getStatusBadgeClass(app.status)}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CandidateApplicationsPage;