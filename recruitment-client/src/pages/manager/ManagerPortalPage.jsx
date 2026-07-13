// src/pages/manager/ManagerPortalPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import CalendarView from '../../components/CalendarView';

const ManagerPortalPage = () => {
  const { user, logout } = useAuth();
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
      // Get recent applications from admin endpoint
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
      // Refresh applications
      await fetchApplications();
      // Clear form for this application
      setEvaluationData({
        ...evaluationData,
        [applicationId]: {},
      });
    } catch (err) {
      alert('Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter applications based on search term and status filter
  const filteredApplications = applications.filter((app) => {
    // Search filter: match candidateName, candidateEmail, or jobTitle (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = app.candidateName?.toLowerCase().includes(searchLower) || false;
    const emailMatch = app.candidateEmail?.toLowerCase().includes(searchLower) || false;
    const jobMatch = app.jobTitle?.toLowerCase().includes(searchLower) || false;
    const searchMatch = searchTerm === '' || nameMatch || emailMatch || jobMatch;

    // Status filter
    const statusMatch = statusFilter === 'All' || app.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const handleViewResume = async (candidateId) => {
    try {
      const response = await apiClient.get(`/Candidates/resume/${candidateId}`, {
        responseType: 'blob'  // Important for files
      });

      // Create a blob URL and open it
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const fileUrl = URL.createObjectURL(fileBlob);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error fetching resume:', error);
      alert('Failed to load resume. Candidate may not have uploaded one.');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Hiring Manager Portal</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.fullName} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

     <section style={styles.section}>
       <div style={styles.sectionHeader}>
          <h2>Recent Applications</h2>
          <span style={styles.resultCount}>
            Showing {filteredApplications.length} of {applications.length} applications
          </span>
        </div>

        {/* Search and Filter Bar */}
        <div style={styles.filterSection}>
          <div style={styles.filterRow}>
            <div style={styles.searchGroup}>
              <input
                type="text"
                placeholder="Search by candidate name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterGroup}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterSelect}
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
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              style={styles.clearFiltersBtn}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <p style={styles.noResults}>
            {applications.length === 0
              ? 'No applications to review.'
              : 'No applications match your filters.'}
          </p>
        ) : (
          filteredApplications.map((app) => (
            <div key={app.id} style={styles.appCard}>
              <div style={styles.appHeader}>
                <h3 style={styles.appTitle}>{app.jobTitle || 'Unknown Job'}</h3>
                <span style={getStatusBadgeStyle(app.status)}>{app.status}</span>
              </div>
              <p style={styles.appDetail}><strong>Candidate:</strong> {app.candidateName || 'Unknown'}</p>
              <p style={styles.appDetail}><strong>Email:</strong> {app.candidateEmail || 'N/A'}</p>
              <p style={styles.appDetail}><strong>Applied:</strong> {new Date(app.appliedAt).toLocaleDateString()}</p>

              <button onClick={() => handleViewResume(app.candidateId)} style={styles.viewResumeBtn}>
              View Resume
              </button>

              {/* Evaluation Form */}
              <div style={styles.evalSection}>
                <h4>Submit Evaluation</h4>
                <div style={styles.evalRow}>
                  <div style={styles.evalGroup}>
                    <label>Technical Score (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={evaluationData[app.id]?.technicalScore || ''}
                      onChange={(e) => handleEvaluationChange(app.id, 'technicalScore', e.target.value)}
                      style={styles.evalInput}
                    />
                  </div>
                  <div style={styles.evalGroup}>
                    <label>Communication Score (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={evaluationData[app.id]?.communicationScore || ''}
                      onChange={(e) => handleEvaluationChange(app.id, 'communicationScore', e.target.value)}
                      style={styles.evalInput}
                    />
                  </div>
                  <div style={styles.evalGroup}>
                    <label>Culture Fit Score (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={evaluationData[app.id]?.cultureFitScore || ''}
                      onChange={(e) => handleEvaluationChange(app.id, 'cultureFitScore', e.target.value)}
                      style={styles.evalInput}
                    />
                  </div>
                </div>
                <div style={styles.evalRow}>
                  <div style={styles.evalGroup}>
                    <label>Feedback</label>
                    <textarea
                      value={evaluationData[app.id]?.feedback || ''}
                      onChange={(e) => handleEvaluationChange(app.id, 'feedback', e.target.value)}
                      rows={2}
                      style={styles.evalTextarea}
                    />
                  </div>
                  <div style={styles.evalGroup}>
                    <label>Recommendation</label>
                    <select
                      value={evaluationData[app.id]?.recommendation || ''}
                      onChange={(e) => handleEvaluationChange(app.id, 'recommendation', e.target.value)}
                      style={styles.evalSelect}
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
                  style={styles.submitBtn}
                >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Interview Calendar */}
      <section style={styles.section}>
        <h2>My Interview Schedule</h2>
        <CalendarView role="HiringManager" />
      </section>
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

const styles = {
  container: 
  { maxWidth: '1200px',
    margin: '0 auto', 
    padding: '20px', 
    fontFamily: 'sans-serif' 
  },
  header:
  { display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: '20px', 
    borderBottom: '1px solid #eee', 
    marginBottom: '24px' 
  },
  title: 
  { margin: 0, 
    color: '#1a1a2e' 
  },
  userInfo: 
  { display: 'flex', 
    alignItems: 'center', 
    gap: '16px' 
  },
  logoutBtn: 
  { padding: '6px 16px', 
    backgroundColor: '#dc3545', 
    color: '#fff', border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer' 
  },
  section: 
  { marginBottom: '40px' 
  },
  appCard: 
  { padding: '16px'
    , border: '1px solid #e0e0e0', 
    borderRadius: '8px', 
    marginBottom: '16px', 
    backgroundColor: '#fafafa' 
  },
  appHeader: 
  { display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  appTitle: 
  { margin: '0 0 8px 0' 

  },
  appDetail: 
  { margin: '4px 0', fontSize: '14px', color: '#555' },
  evalSection: { marginTop: '12px', padding: '12px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' },
  evalRow: { display: 'flex', gap: '16px', marginBottom: '12px' },
  evalGroup: { flex: '1' },
  evalInput: { width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  evalTextarea: { width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  evalSelect: { width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  submitBtn: { padding: '8px 16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '16px' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', fontFamily: 'sans-serif' },
  viewResumeBtn: {
  padding: '6px 14px',
  backgroundColor: '#2196f3',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  marginTop: '8px',
  display: 'inline-block',
  textDecoration: 'none',

   sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  resultCount: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 'normal',
  },
  filterSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchGroup: {
    flex: '2',
    minWidth: '250px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  filterGroup: {
    flex: '1',
    minWidth: '150px',
  },
  filterSelect: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    cursor: 'pointer',
    outline: 'none',
  },
  clearFiltersBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  },
  noResults: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px dashed #ddd',
  },
},
};

export default ManagerPortalPage;