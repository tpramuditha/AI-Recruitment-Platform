// src/pages/recruiter/RecruiterPortalPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const RecruiterPortalPage = () => {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    employmentType: 'FullTime',
    requiredSkills: '',
  });

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/Jobs');
      setJobs(response.data);
    } catch (err) {
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/Jobs', formData);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        department: '',
        location: '',
        employmentType: 'FullTime',
        requiredSkills: '',
      });
      await fetchJobs();
    } catch (err) {
      setError('Failed to create job.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewApplicants = async (jobId) => {
    setSelectedJobId(jobId);
    try {
      const response = await apiClient.get(`/Applications/job/${jobId}`);
      setApplicants(response.data);
    } catch (err) {
      setApplicants([]);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await apiClient.put(`/Applications/${applicationId}/status`, { status: newStatus });
      // Refresh applicants
      await handleViewApplicants(selectedJobId);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const getJobApplicants = (jobId) => {
    if (selectedJobId === jobId) {
      return applicants;
    }
    return null;
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Recruiter Portal</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.fullName} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Post Job */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>Your Jobs</h2>
          <button onClick={() => setShowForm(!showForm)} style={styles.primaryBtn}>
            {showForm ? 'Cancel' : '+ Post New Job'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmitJob} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Title *</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Department *</label>
                <input
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Location *</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="FullTime">Full Time</option>
                  <option value="PartTime">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                style={styles.textarea}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Required Skills (comma separated)</label>
              <input
                name="requiredSkills"
                value={formData.requiredSkills}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="C#, ASP.NET, React"
              />
            </div>
            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Creating...' : 'Create Job'}
            </button>
          </form>
        )}

        {/* Job List */}
        {jobs.length === 0 ? (
          <p>You haven't posted any jobs yet.</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} style={styles.jobCard}>
              <div style={styles.jobHeader}>
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <span style={job.isActive ? styles.activeBadge : styles.inactiveBadge}>
                  {job.isActive ? 'Active' : 'Closed'}
                </span>
              </div>
              <p style={styles.jobDetail}><strong>Department:</strong> {job.department}</p>
              <p style={styles.jobDetail}><strong>Location:</strong> {job.location}</p>
              <p style={styles.jobDetail}><strong>Type:</strong> {job.employmentType}</p>
              <button
                onClick={() => handleViewApplicants(job.id)}
                style={styles.secondaryBtn}
              >
                View Applicants
              </button>

              {/* Applicants List */}
              {selectedJobId === job.id && (
                <div style={styles.applicantsSection}>
                  <h4>Applicants</h4>
                  {applicants.length === 0 ? (
                    <p>No applicants yet.</p>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicants.map((app) => (
                          <tr key={app.id}>
                            <td>{app.candidateName || 'Unknown'}</td>
                            <td>{app.candidateEmail || 'N/A'}</td>
                            <td>
                              <span style={getStatusBadgeStyle(app.status)}>
                                {app.status}
                              </span>
                            </td>
                            <td>
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                style={styles.statusSelect}
                              >
                                <option value="Submitted">Submitted</option>
                                <option value="UnderReview">Under Review</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Hired">Hired</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))
        )}
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
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #eee', marginBottom: '24px' },
  title: { margin: 0, color: '#1a1a2e' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoutBtn: { padding: '6px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  section: { marginBottom: '40px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  primaryBtn: { padding: '8px 16px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  secondaryBtn: { padding: '6px 12px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '8px' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
  form: { padding: '16px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9' },
  formRow: { display: 'flex', gap: '16px', marginBottom: '12px' },
  formGroup: { flex: '1', marginBottom: '12px' },
  input: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  jobCard: { padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#fafafa' },
  jobHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { margin: '0 0 8px 0' },
  jobDetail: { margin: '4px 0', fontSize: '14px', color: '#555' },
  activeBadge: { padding: '2px 10px', borderRadius: '12px', fontSize: '12px', backgroundColor: '#4caf50', color: '#fff' },
  inactiveBadge: { padding: '2px 10px', borderRadius: '12px', fontSize: '12px', backgroundColor: '#f44336', color: '#fff' },
  applicantsSection: { marginTop: '12px', padding: '12px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  statusSelect: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' },
  error: { padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '16px' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', fontFamily: 'sans-serif' },
};

export default RecruiterPortalPage;