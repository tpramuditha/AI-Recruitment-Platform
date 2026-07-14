import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import './ManagerApplicationsPage.css';

const ManagerApplicationsPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluationData, setEvaluationData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/Admin/applications/recent');
      setApplications(response.data.applications || []);
    } catch (err) {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleEvaluationChange = (applicationId, field, value) => {
    setEvaluationData({
      ...evaluationData,
      [applicationId]: {
        ...evaluationData[applicationId],
        [field]: value,
      },
    });
  };

  const handleSubmitEvaluation = async (applicationId) => {
    const data = evaluationData[applicationId];
    if (!data || !data.technicalScore || !data.communicationScore || !data.cultureFitScore || !data.recommendation) {
      alert('Please fill in all required fields (scores and recommendation).');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/Evaluations', {
        applicationId,
        technicalScore: parseInt(data.technicalScore),
        communicationScore: parseInt(data.communicationScore),
        cultureFitScore: parseInt(data.cultureFitScore),
        feedback: data.feedback || '',
        recommendation: data.recommendation,
      });
      alert('Evaluation submitted successfully!');
      await fetchApplications();
      setEvaluationData({ ...evaluationData, [applicationId]: {} });
    } catch (err) {
      alert('Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = app.candidateName?.toLowerCase().includes(searchLower) || false;
    const emailMatch = app.candidateEmail?.toLowerCase().includes(searchLower) || false;
    const jobMatch = app.jobTitle?.toLowerCase().includes(searchLower) || false;
    const searchMatch = searchTerm === '' || nameMatch || emailMatch || jobMatch;
    const statusMatch = statusFilter === 'All' || app.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const handleViewResume = async (candidateId) => {
    try {
      const response = await apiClient.get(`/Candidates/resume/${candidateId}`, { responseType: 'blob' });
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const fileUrl = URL.createObjectURL(fileBlob);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error fetching resume:', error);
      alert('Failed to load resume. Candidate may not have uploaded one.');
    }
  };

  if (loading) {
    return <div className="manager-applications-loading">Loading applications...</div>;
  }

  return (
    <div className="manager-applications-container">
      <h1 className="manager-applications-title">Recent Applications</h1>
      <div className="manager-applications-stats">
        Showing {filteredApplications.length} of {applications.length} applications
      </div>

      {error && <div className="manager-applications-error">{error}</div>}

      <div className="manager-filter-section">
        <div className="manager-filter-row">
          <div className="manager-search-group">
            <input
              type="text"
              placeholder="Search by candidate name, email, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="manager-search-input"
            />
          </div>
          <div className="manager-filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="manager-filter-select"
            >
              <option value="All">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="UnderReview">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Hired">Hired</option>
            </select>
          </div>
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
            className="manager-clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <p className="manager-no-results">
          {applications.length === 0 ? 'No applications to review.' : 'No applications match your filters.'}
        </p>
      ) : (
        filteredApplications.map((app) => (
          <div key={app.id} className="manager-app-card">
            <div className="manager-app-header">
              <h3 className="manager-app-title">{app.jobTitle || 'Unknown Job'}</h3>
              <span style={getStatusBadgeStyle(app.status)}>{app.status}</span>
            </div>
            <p className="manager-app-detail"><strong>Candidate:</strong> {app.candidateName || 'Unknown'}</p>
            <p className="manager-app-detail"><strong>Email:</strong> {app.candidateEmail || 'N/A'}</p>
            <p className="manager-app-detail"><strong>Applied:</strong> {new Date(app.appliedAt).toLocaleDateString()}</p>

            <button onClick={() => handleViewResume(app.candidateId)} className="manager-view-resume-btn">
              View Resume
            </button>

            <div className="manager-eval-section">
              <h4>Submit Evaluation</h4>
              <div className="manager-eval-row">
                <div className="manager-eval-group">
                  <label>Technical Score (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={evaluationData[app.id]?.technicalScore || ''}
                    onChange={(e) => handleEvaluationChange(app.id, 'technicalScore', e.target.value)}
                    className="manager-eval-input"
                  />
                </div>
                <div className="manager-eval-group">
                  <label>Communication Score (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={evaluationData[app.id]?.communicationScore || ''}
                    onChange={(e) => handleEvaluationChange(app.id, 'communicationScore', e.target.value)}
                    className="manager-eval-input"
                  />
                </div>
                <div className="manager-eval-group">
                  <label>Culture Fit Score (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={evaluationData[app.id]?.cultureFitScore || ''}
                    onChange={(e) => handleEvaluationChange(app.id, 'cultureFitScore', e.target.value)}
                    className="manager-eval-input"
                  />
                </div>
              </div>
              <div className="manager-eval-row">
                <div className="manager-eval-group">
                  <label>Feedback</label>
                  <textarea
                    value={evaluationData[app.id]?.feedback || ''}
                    onChange={(e) => handleEvaluationChange(app.id, 'feedback', e.target.value)}
                    rows={2}
                    className="manager-eval-textarea"
                  />
                </div>
                <div className="manager-eval-group">
                  <label>Recommendation</label>
                  <select
                    value={evaluationData[app.id]?.recommendation || ''}
                    onChange={(e) => handleEvaluationChange(app.id, 'recommendation', e.target.value)}
                    className="manager-eval-select"
                  >
                    <option value="">Select...</option>
                    <option value="Hire">Hire</option>
                    <option value="NoHire">No Hire</option>
                    <option value="NextRound">Next Round</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => handleSubmitEvaluation(app.id)}
                disabled={submitting}
                className="manager-submit-eval-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Helper function for status badges
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

export default ManagerApplicationsPage;