// src/pages/candidate/CandidatePortalPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const CandidatePortalPage = () => {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');

  // Resume upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobsResponse, appsResponse, profileResponse] = await Promise.all([
        apiClient.get('/Jobs'),
        apiClient.get('/Applications/my'),
        apiClient.get('/Candidates/my-profile')
      ]);
      setJobs(jobsResponse.data);
      setMyApplications(appsResponse.data);
      setProfile(profileResponse.data);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply to job
  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    setApplyMessage('');
    try {
      await apiClient.post('/Applications', { jobId });
      setApplyMessage('Application submitted successfully!');
      await fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to apply.';
      setApplyMessage(`Error: ${message}`);
    } finally {
      setApplyingJobId(null);
    }
  };

  // Resume upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate extension
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setUploadMessage('Error: Only .pdf, .doc, .docx files are allowed.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadMessage('Error: File size exceeds 5MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file first.');
      return;
    }

    setUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await apiClient.post('/Candidates/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage(`✅ ${response.data.message}`);
      setSelectedFile(null);
      // Refresh profile to show new resume
      const profileRes = await apiClient.get('/Candidates/my-profile');
      setProfile(profileRes.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed.';
      setUploadMessage(`❌ Error: ${msg}`);
    } finally {
      setUploading(false);
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

      {/* My Profile Section */}
      <section style={styles.section}>
        <h2>My Profile</h2>
        {profile ? (
          <div style={styles.profileCard}>
            <div style={styles.profileRow}>
              <span><strong>Name:</strong> {profile.fullName}</span>
              <span><strong>Email:</strong> {profile.email}</span>
            </div>
            <div style={styles.profileRow}>
              <span><strong>Phone:</strong> {profile.phoneNumber || 'Not set'}</span>
              <span><strong>Skills:</strong> {profile.skills || 'Not set'}</span>
            </div>
            <div style={styles.profileRow}>
              <span>
                <strong>Resume:</strong> {profile.hasResume ? (
                  <a href={`https://localhost:7241/${profile.resumeFilePath}`} target="_blank" rel="noopener noreferrer">
                    View Resume
                  </a>
                ) : 'Not uploaded'}
              </span>
              <span><strong>Member since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Resume Upload */}
            <div style={styles.uploadSection}>
              <h4>Upload New Resume</h4>
              <div style={styles.uploadRow}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={uploading}
                  style={styles.fileInput}
                />
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  style={styles.uploadBtn}
                >
                  {uploading ? 'Uploading...' : 'Upload Resume'}
                </button>
              </div>
              {uploadMessage && <p style={uploadMessage.startsWith('✅') ? styles.success : styles.error}>{uploadMessage}</p>}
              {selectedFile && !uploading && (
                <p style={styles.fileInfo}>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
              )}
            </div>
          </div>
        ) : (
          <p>No profile found. Please complete your profile.</p>
        )}
      </section>

      {/* Job List */}
      <section style={styles.section}>
        <h2>Available Jobs</h2>
        {jobs.length === 0 ? (
          <p>No jobs available at the moment.</p>
        ) : (
          <div style={styles.jobGrid}>
            {jobs.map((job) => (
              <div key={job.id} style={styles.jobCard}>
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <p style={styles.jobDetail}><strong>Department:</strong> {job.department}</p>
                <p style={styles.jobDetail}><strong>Location:</strong> {job.location}</p>
                <p style={styles.jobDetail}><strong>Type:</strong> {job.employmentType}</p>
                <p style={styles.jobDetail}><strong>Skills:</strong> {job.requiredSkills || 'Not specified'}</p>
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={applyingJobId === job.id}
                  style={styles.applyBtn}
                >
                  {applyingJobId === job.id ? 'Applying...' : 'Apply'}
                </button>
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
  profileCard: {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  profileRow: {
    display: 'flex',
    gap: '32px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  uploadSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0',
  },
  uploadRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileInput: {
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  uploadBtn: {
    padding: '6px 16px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  fileInfo: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#555',
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  jobCard: {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  jobTitle: {
    margin: '0 0 8px 0',
    color: '#1a1a2e',
  },
  jobDetail: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#555',
  },
  applyBtn: {
    marginTop: '12px',
    padding: '6px 16px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
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