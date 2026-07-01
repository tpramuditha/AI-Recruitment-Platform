// src/pages/candidate/CandidatePortalPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const CandidatePortalPage = () => {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch AI-recommended jobs and applications in parallel
      const [jobsResponse, appsResponse] = await Promise.all([
        apiClient.get('/AI/jobs/recommended'),
        apiClient.get('/Applications/my')
      ]);

      // Extract recommendations from AI response
      const recommendations = jobsResponse.data?.recommendations || [];
      
      // For each recommendation, we need the full job details from the regular Jobs endpoint
      // Since the AI endpoint returns JobMatchResult with limited fields, 
      // we fetch the full job data separately
      const fullJobsResponse = await apiClient.get('/Jobs');
      const fullJobs = fullJobsResponse.data || [];

      // Merge AI scores with full job data
      const mergedJobs = fullJobs.map(job => {
        const match = recommendations.find(r => r.jobId === job.id);
        return {
          ...job,
          matchScore: match?.matchScore || 0,
          matchPercentage: match?.matchPercentage || '0%'
        };
      });

      setJobs(mergedJobs);
      setMyApplications(appsResponse.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    setApplyMessage('');
    try {
      await apiClient.post('/Applications', { jobId });
      setApplyMessage('Application submitted successfully!');
      // Refresh data
      await fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to apply.';
      setApplyMessage(`Error: ${message}`);
    } finally {
      setApplyingJobId(null);
    }
  };

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

  // Get match badge color based on score
  const getMatchBadgeStyle = (score) => {
    let color;
    if (score >= 70) {
      color = '#4caf50'; // Green - Good match
    } else if (score >= 40) {
      color = '#ff9800'; // Yellow - Medium match
    } else {
      color = '#9e9e9e'; // Grey - Low match
    }
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: color,
      color: '#fff',
      marginLeft: '8px',
    };
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Candidate Portal</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.fullName} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {applyMessage && <div style={styles.success}>{applyMessage}</div>}

      {/* Job List with AI Match Scores */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>Recommended Jobs</h2>
          <span style={styles.hint}>Match scores show how well your skills align with each job</span>
        </div>
        {jobs.length === 0 ? (
          <p>No jobs available at the moment.</p>
        ) : (
          <div style={styles.jobGrid}>
            {jobs.map((job) => (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobHeader}>
                  <h3 style={styles.jobTitle}>{job.title}</h3>
                  {job.matchScore > 0 && (
                    <span style={getMatchBadgeStyle(job.matchScore)}>
                      Match: {job.matchPercentage}
                    </span>
                  )}
                </div>
                <p style={styles.jobDetail}><strong>Department:</strong> {job.department}</p>
                <p style={styles.jobDetail}><strong>Location:</strong> {job.location}</p>
                <p style={styles.jobDetail}><strong>Type:</strong> {job.employmentType}</p>
                <p style={styles.jobDetail}><strong>Required Skills:</strong> {job.requiredSkills || 'Not specified'}</p>
                <div style={styles.jobActions}>
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={applyingJobId === job.id}
                    style={styles.applyBtn}
                  >
                    {applyingJobId === job.id ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Applications */}
      <section style={styles.section}>
        <h2>My Applications</h2>
        {myApplications.length === 0 ? (
          <p>You haven't applied to any jobs yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Job</th>
                <th>Department</th>
                <th>Applied Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.map((app) => (
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
      </section>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    color: '#1a1a2e',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoutBtn: {
    padding: '6px 16px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  section: {
    marginBottom: '40px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  hint: {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  jobCard: {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    transition: 'box-shadow 0.2s',
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  jobTitle: {
    margin: 0,
    color: '#1a1a2e',
    fontSize: '18px',
  },
  jobDetail: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#555',
  },
  jobActions: {
    marginTop: '12px',
    display: 'flex',
    gap: '8px',
  },
  applyBtn: {
    padding: '6px 20px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: '1',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  error: {
    padding: '12px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  success: {
    padding: '12px',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    fontFamily: 'sans-serif',
  },
};

export default CandidatePortalPage;