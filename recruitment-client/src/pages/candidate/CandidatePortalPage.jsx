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
  const [extractorText, setExtractorText] = useState('');
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState('');
  const [extractedSkillList, setExtractedSkillList] = useState([]);
  const [extractError, setExtractError] = useState(''); 

  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ fullName: '', phoneNumber: '', skills: '' });
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Resume upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const fetchData = async () => {
  setLoading(true);
  setError('');
  try {
    const [jobsResponse, appsResponse] = await Promise.all([
      apiClient.get('/Jobs'),
      apiClient.get('/Applications/my'),
    ]);
    setJobs(jobsResponse.data);
    setMyApplications(appsResponse.data);

    try {
      const profileResponse = await apiClient.get('/Candidates/my-profile');
      setProfile(profileResponse.data);
      if (profileResponse.data) {
        setEditData({
          fullName: profileResponse.data.fullName || '',
          phoneNumber: profileResponse.data.phoneNumber || '',
          skills: profileResponse.data.skills || ''
        });
      }
    } catch (profileErr) {
      setProfile(null);
    }

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
      // Refresh profile
      const profileRes = await apiClient.get('/Candidates/my-profile');
      setProfile(profileRes.data);
      // Update edit data with new resume info
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed.';
      setUploadMessage(`❌ Error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  // Profile editing
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
    setSaveMessage('');
  };

  const handleStartEdit = () => {
    if (profile) {
      setEditData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        skills: profile.skills || ''
      });
      setIsEditing(true);
      setSaveMessage('');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveMessage('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await apiClient.put('/Candidates/my-profile', {
        fullName: editData.fullName,
        phoneNumber: editData.phoneNumber,
        skills: editData.skills
      });
      setProfile(response.data);
      setIsEditing(false);
      setSaveMessage('✅ Profile updated successfully!');
      // Update edit data with new values
      setEditData({
        fullName: response.data.fullName || '',
        phoneNumber: response.data.phoneNumber || '',
        skills: response.data.skills || ''
      });
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setSaveMessage(`❌ Error: ${msg}`);
    } finally {
      setSaving(false);
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

  const handleExtractSkills = async () => {
  if (!extractorText.trim()) return;
  setExtractingSkills(true);
  setExtractError('');
  setExtractedSkills('');
  setExtractedSkillList([]);
  try {
    const response = await apiClient.post('/AI/extract-skills', {
      profileText: extractorText
    });
    setExtractedSkills(response.data.extractedSkills);
    setExtractedSkillList(response.data.skillList || []);
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to extract skills.';
    setExtractError(msg);
  } finally {
    setExtractingSkills(false);
  }
};

const handleApplyExtractedSkills = () => {
  if (extractedSkills) {
    setEditData({ ...editData, skills: extractedSkills });
    setExtractorText('');
    setExtractedSkills('');
    setExtractedSkillList([]);
  }
};

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
            {!isEditing ? (
              // View mode
              <div>
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
                <div style={styles.profileActions}>
                  <button onClick={handleStartEdit} style={styles.editBtn}>Edit Profile</button>
                </div>
                {saveMessage && <p style={saveMessage.startsWith('✅') ? styles.success : styles.error}>{saveMessage}</p>}
              </div>
            ) : (
              // Edit mode
              <div>
                <div style={styles.profileRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={editData.fullName}
                      onChange={handleEditChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email (read-only)</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                </div>
                <div style={styles.profileRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={editData.phoneNumber}
                      onChange={handleEditChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Skills</label>
                    <input
                      type="text"
                      name="skills"
                      value={editData.skills}
                      onChange={handleEditChange}
                      style={styles.input}
                      placeholder="e.g. C#, React, MySQL"
                    />
                    <span style={styles.hint}>Enter skills separated by commas</span>
                  </div>
                </div>
                <div style={styles.profileActions}>
                  <button onClick={handleSaveProfile} disabled={saving} style={styles.saveBtn}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={handleCancelEdit} style={styles.cancelBtn}>Cancel</button>
                </div>
                {saveMessage && <p style={saveMessage.startsWith('✅') ? styles.success : styles.error}>{saveMessage}</p>}
              </div>
            )}

            {/* AI Skill Extractor */}
            <div style={styles.aiExtractorSection}>
              <h4>AI Skill Extractor</h4>
              <p style={styles.hint}>Paste your CV or profile text to auto-extract skills</p>
              <div style={styles.extractorRow}>
                <textarea
                  value={extractorText}
                  onChange={(e) => setExtractorText(e.target.value)}
                  placeholder="Paste your CV text here..."
                  rows={4}
                  style={styles.extractorTextarea}
                />
             </div>
             <div style={styles.extractorActions}>
                <button
                   onClick={handleExtractSkills}
                   disabled={!extractorText || extractingSkills}
                   style={styles.extractorBtn}
                >
                  {extractingSkills ? 'Extracting...' : '🤖 Extract Skills with AI'}
                </button>
                {extractedSkills && (
                   <button onClick={handleApplyExtractedSkills} style={styles.applyExtractedBtn}>
                      Use These Skills
                   </button>
                 )}
              </div>
              {extractError && <p style={styles.error}>{extractError}</p>}
              {extractedSkills && (
                 <div style={styles.extractedSkillsResult}>
                 <p><strong>Extracted Skills:</strong></p>
                 <div style={styles.skillTags}>
                   {extractedSkillList.map((skill, index) => (
                     <span key={index} style={styles.skillTag}>{skill}</span>
                   ))}
                 </div>
               </div>
              )}
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

// Styles (updated with new elements)
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
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  formGroup: {
    flex: '1',
    minWidth: '200px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  hint: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  profileActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
  },
  editBtn: {
    padding: '6px 16px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '6px 16px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '6px 16px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
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

  aiExtractorSection: {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #e0e0e0',
},
extractorRow: { marginBottom: '8px' },
extractorTextarea: {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  boxSizing: 'border-box',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  resize: 'vertical',
},
extractorActions: {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap',
},
extractorBtn: {
  padding: '8px 20px',
  backgroundColor: '#9c27b0',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
},
applyExtractedBtn: {
  padding: '8px 20px',
  backgroundColor: '#28a745',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
},
extractedSkillsResult: {
  marginTop: '12px',
  padding: '12px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
},
skillTags: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '8px',
},
skillTag: {
  padding: '4px 12px',
  backgroundColor: '#1a73e8',
  color: '#fff',
  borderRadius: '16px',
  fontSize: '13px',
},
};

export default CandidatePortalPage;