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
      setError('Failed to load applications pipeline entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleEvaluationChange = (applicationId, field, value) => {
    setEvaluationData({
      ...evaluationData,
      [applicationId]: { ...evaluationData[applicationId], [field]: value },
    });
  };

  const handleSubmitEvaluation = async (applicationId) => {
    const data = evaluationData[applicationId];
    if (!data || !data.technicalScore || !data.communicationScore || !data.cultureFitScore || !data.recommendation) {
      alert('Please complete all required system scoring options.');
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
      alert('Evaluation record saved to system.');
      await fetchApplications();
      setEvaluationData({ ...evaluationData, [applicationId]: {} });
    } catch (err) {
      alert('Failed to transmit metrics evaluation.');
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
      alert('Resume file matching record index was not found.');
    }
  };

  if (loading) {
    return (
      <div className="pf-loading-spinner-container">
        <div className="pf-loading-spinner"></div>
        <p>Syncing applications pipeline...</p>
      </div>
    );
  }

  return (
    <div className="pf-page-fluid-wrapper animate-fade-in">
      <div className="pf-view-header-block">
        <div>
          <h1 className="pf-main-view-title">Recent Applications</h1>
          <p className="pf-main-view-subtitle">Review incoming profiles and complete scorecard assessments</p>
        </div>
        <div className="pf-counter-badge">
          Showing {filteredApplications.length} of {applications.length} Items
        </div>
      </div>

      {error && <div className="pf-system-alert-error">⚠️ {error}</div>}

      {/* Clean Segmented Filter Controls */}
      <div className="pf-filter-card-bar">
        <div className="pf-filter-flex-row">
          <div className="pf-input-search-container">
            <input
              type="text"
              placeholder="Search by candidate name, email, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pf-filter-native-input"
            />
          </div>
          <div className="pf-dropdown-container">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pf-filter-native-select"
            >
              <option value="All">All Status Options</option>
              <option value="Submitted">Submitted</option>
              <option value="UnderReview">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Hired">Hired</option>
            </select>
          </div>
          <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); }} className="pf-filter-clear-btn">
            Reset Filters
          </button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="pf-empty-state-card">
          <p>{applications.length === 0 ? 'No applications present in workflow pipeline.' : 'No rows match filter metrics query.'}</p>
        </div>
      ) : (
        <div className="pf-cards-vertical-stack">
          {filteredApplications.map((app) => {
            const initialLetter = app.candidateName ? app.candidateName.charAt(0).toUpperCase() : 'C';
            return (
              <div key={app.id} className="pf-application-master-card">
                
                {/* Upper Identity Row Block */}
                <div className="pf-app-card-top-row">
                  <div className="pf-candidate-profile-block">
                    <div className="pf-candidate-avatar">{initialLetter}</div>
                    <div>
                      <h3 className="pf-candidate-name">{app.candidateName || 'Unknown'}</h3>
                      <span className="pf-candidate-email">{app.candidateEmail || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="pf-job-meta-block">
                    <span className="pf-job-title-tag">{app.jobTitle || 'Unknown Job Title'}</span>
                    <span className={`pf-status-badge badge-${app.status?.toLowerCase() || 'default'}`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                <div className="pf-card-line-divider"></div>

                <div className="pf-app-card-mid-row">
                  <span className="pf-application-date">Applied On: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  <button onClick={() => handleViewResume(app.candidateId)} className="pf-btn-secondary">
                    📄 Open Candidate Resume
                  </button>
                </div>

                {/* Unified Sub-Form Scorecard Accordion Block */}
                <div className="pf-evaluation-form-wrapper">
                  <h4 className="pf-evaluation-form-heading">Submit Evaluation Metrics</h4>
                  
                  <div className="pf-form-grid-three-cols">
                    <div className="pf-input-control-group">
                      <label>Technical Competency (1-5)</label>
                      <input
                        type="number" min="1" max="5" placeholder="--"
                        value={evaluationData[app.id]?.technicalScore || ''}
                        onChange={(e) => handleEvaluationChange(app.id, 'technicalScore', e.target.value)}
                        className="pf-field-input"
                      />
                    </div>
                    <div className="pf-input-control-group">
                      <label>Communication (1-5)</label>
                      <input
                        type="number" min="1" max="5" placeholder="--"
                        value={evaluationData[app.id]?.communicationScore || ''}
                        onChange={(e) => handleEvaluationChange(app.id, 'communicationScore', e.target.value)}
                        className="pf-field-input"
                      />
                    </div>
                    <div className="pf-input-control-group">
                      <label>Culture Alignment (1-5)</label>
                      <input
                        type="number" min="1" max="5" placeholder="--"
                        value={evaluationData[app.id]?.cultureFitScore || ''}
                        onChange={(e) => handleEvaluationChange(app.id, 'cultureFitScore', e.target.value)}
                        className="pf-field-input"
                      />
                    </div>
                  </div>

                  <div className="pf-form-grid-split">
                    <div className="pf-input-control-group">
                      <label>Internal Assessment Commentary</label>
                      <textarea
                        value={evaluationData[app.id]?.feedback || ''}
                        onChange={(e) => handleEvaluationChange(app.id, 'feedback', e.target.value)}
                        rows={2}
                        placeholder="Add candidate notes..."
                        className="pf-field-textarea"
                      />
                    </div>
                    <div className="pf-input-control-group">
                      <label>Final Action Decision</label>
                      <select
                        value={evaluationData[app.id]?.recommendation || ''}
                        onChange={(e) => handleEvaluationChange(app.id, 'recommendation', e.target.value)}
                        className="pf-field-select"
                      >
                        <option value="">Select option...</option>
                        <option value="Hire">Hire</option>
                        <option value="NoHire">No Hire</option>
                        <option value="NextRound">Next Round</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubmitEvaluation(app.id)}
                    disabled={submitting}
                    className="pf-btn-primary-success"
                  >
                    {submitting ? 'Transmitting Scorecard...' : 'Submit Evaluation Record'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagerApplicationsPage;