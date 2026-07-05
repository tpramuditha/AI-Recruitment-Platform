// src/pages/recruiter/RecruiterPortalPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const RecruiterPortalPage = () => {
  const { user, logout } = useAuth();
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // AI Ranking states
  const [showAiRanking, setShowAiRanking] = useState(false);
  const [aiRankingData, setAiRankingData] = useState(null);
  const [loadingAiRanking, setLoadingAiRanking] = useState(false);
  const [aiRankingError, setAiRankingError] = useState('');


  // Interview states
  const [showInterviewForm, setShowInterviewForm] = useState(null); // applicationId or null
  const [interviewData, setInterviewData] = useState({});
  const [interviewMessage, setInterviewMessage] = useState({});
  const [fetchingInterviews, setFetchingInterviews] = useState({});
  const [interviewsData, setInterviewsData] = useState({});

  // Form state for job posting
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
    // Reset search and filter when viewing a new job's applicants
    setSearchTerm(''); 
    setStatusFilter('All');
    try {
      const response = await apiClient.get(`/Applications/job/${jobId}`);
      setApplicants(response.data);
      // Clear any previously fetched interviews for this job
      setInterviewsData({});
    } catch (err) {
      setApplicants([]);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await apiClient.put(`/Applications/${applicationId}/status`, { status: newStatus });
      await handleViewApplicants(selectedJobId);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // AI Ranking handler
const handleAiRanking = async (jobId) => {
  if (showAiRanking) {
    setShowAiRanking(false);
    return;
  }

  setShowAiRanking(true);
  setLoadingAiRanking(true);
  setAiRankingError('');
  setAiRankingData(null);

  try {
    const response = await apiClient.get(`/AI/candidates/ranked/${jobId}`);
    setAiRankingData(response.data);
  } catch (err) {
    setAiRankingError('Failed to load AI ranking. Please try again.');
    setAiRankingData(null);
  } finally {
    setLoadingAiRanking(false);
  }
};

  // Interview handlers
  const handleInterviewInputChange = (applicationId, field, value) => {
    setInterviewData({
      ...interviewData,
      [applicationId]: {
        ...interviewData[applicationId],
        [field]: value,
      },
    });
  };

  const handleScheduleInterview = async (applicationId) => {
    const data = interviewData[applicationId];
    if (!data || !data.scheduledAt || !data.interviewerUserId) {
      setInterviewMessage({
        ...interviewMessage,
        [applicationId]: { type: 'error', text: 'Please fill in Date/Time and Interviewer ID.' }
      });
      return;
    }

    setSubmitting(true);
    setInterviewMessage({ ...interviewMessage, [applicationId]: null });

    try {
      await apiClient.post('/Interviews', {
        applicationId: applicationId,
        scheduledAt: data.scheduledAt,
        durationMinutes: parseInt(data.durationMinutes) || 60,
        interviewerUserId: data.interviewerUserId,
        notes: data.notes || '',
      });

      setInterviewMessage({
        ...interviewMessage,
        [applicationId]: { type: 'success', text: '✅ Interview scheduled successfully!' }
      });

      // Clear form for this application
      setInterviewData({
        ...interviewData,
        [applicationId]: {}
      });

      // Refresh interviews for this application
      await fetchInterviews(applicationId);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setInterviewMessage(prev => ({ ...prev, [applicationId]: null }));
      }, 3000);

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to schedule interview.';
      setInterviewMessage({
        ...interviewMessage,
        [applicationId]: { type: 'error', text: `❌ ${msg}` }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchInterviews = async (applicationId) => {
    setFetchingInterviews({ ...fetchingInterviews, [applicationId]: true });
    try {
      const response = await apiClient.get(`/Interviews/application/${applicationId}`);
      setInterviewsData({
        ...interviewsData,
        [applicationId]: response.data || []
      });
    } catch (err) {
      setInterviewsData({
        ...interviewsData,
        [applicationId]: []
      });
    } finally {
      setFetchingInterviews({ ...fetchingInterviews, [applicationId]: false });
    }
  };

  const handleMarkComplete = async (interviewId, applicationId) => {
    try {
      await apiClient.put(`/Interviews/${interviewId}`, { status: 'Completed' });
      // Refresh interviews for this application
      await fetchInterviews(applicationId);
    } catch (err) {
      alert('Failed to mark interview as completed.');
    }
  };

  const toggleInterviewForm = (applicationId) => {
    if (showInterviewForm === applicationId) {
      setShowInterviewForm(null);
    } else {
      setShowInterviewForm(applicationId);
      // Fetch interviews when opening the form
      if (!interviewsData[applicationId]) {
        fetchInterviews(applicationId);
      }
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

  const getInterviewStatusBadgeStyle = (status) => {
    const colors = {
      'Scheduled': '#1a73e8',
      'Completed': '#4caf50',
      'Cancelled': '#f44336',
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

  const getMatchScoreBadgeStyle = (score) => {
  let color = '';
  let textColor = '#fff';
  
  if (score >= 70) {
    color = '#4caf50'; // Green
  } else if (score >= 40) {
    color = '#ff9800'; // Orange
  } else {
    color = '#9e9e9e'; // Grey
  }

  return {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: color,
    color: textColor,
  };
 };

  // Filter applicants based on search term and status filter
  const filteredApplicants = applicants.filter((app) => {
  // Search filter: match candidateName or candidateEmail (case-insensitive)
  const searchLower = searchTerm.toLowerCase();
  const nameMatch = app.candidateName?.toLowerCase().includes(searchLower) || false;
  const emailMatch = app.candidateEmail?.toLowerCase().includes(searchLower) || false;
  const searchMatch = searchTerm === '' || nameMatch || emailMatch;

  // Status filter
  const statusMatch = statusFilter === 'All' || app.status === statusFilter;

  return searchMatch && statusMatch;
 });


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

                  {/* Search and Filter */}
                <div style={styles.filterSection}>
                  <div style={styles.filterRow}>
                    <div style={styles.searchGroup}>
                      <input
                        type="text"
                        placeholder="Search by name or email..."
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
               </div>
              <div style={styles.filterCount}>
                Showing {filteredApplicants.length} of {applicants.length} applicants
             </div>
            </div>

            <div style={styles.filterGroup}>
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

                  {/* AI Ranking Section */}
<div style={styles.aiRankingSection}>
  <button
    onClick={() => handleAiRanking(selectedJobId)}
    style={styles.aiRankingBtn}
  >
    {showAiRanking ? 'Hide AI Ranking' : 'Show AI Ranking'}
  </button>

  {showAiRanking && (
    <div style={styles.aiRankingContent}>
      {loadingAiRanking ? (
        <p style={styles.loadingText}>Calculating AI ranking...</p>
      ) : aiRankingError ? (
        <p style={styles.error}>{aiRankingError}</p>
      ) : aiRankingData && aiRankingData.rankedCandidates && aiRankingData.rankedCandidates.length > 0 ? (
        <div>
          <p style={styles.aiRankingInfo}>
            <strong>{aiRankingData.totalCandidates}</strong> candidates ranked for 
            <strong> {aiRankingData.jobTitle}</strong>
          </p>
          {aiRankingData.rankedCandidates.map((candidate, index) => (
            <div key={candidate.candidateId} style={styles.rankedCandidate}>
              <div style={styles.rankNumber}>#{index + 1}</div>
              <div style={styles.rankedInfo}>
                <div style={styles.rankedName}>{candidate.fullName || 'Unknown'}</div>
                <div style={styles.rankedEmail}>{candidate.email || 'N/A'}</div>
                <div style={styles.rankedSkills}>
                  <strong>Skills:</strong> {candidate.skills || 'Not specified'}
                </div>
              </div>
              <div style={styles.rankedScore}>
                <span style={getMatchScoreBadgeStyle(candidate.matchScore)}>
                  {candidate.matchPercentage || '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.noRankingData}>
          No ranking data available. Candidates may need to update their skills.
        </p>
      )}
    </div>
  )}
</div>


                  {filteredApplicants.length === 0 ? (
                    <p>{applicants.length === 0 ? 'No applicants yet.' : 'No applicants match your filters.'}</p>
                  ) : (
                    <div>
                      {filteredApplicants.map((app) => (
                        <div key={app.id} style={styles.applicantCard}>
                          <div style={styles.applicantHeader}>
                            <div>
                              <strong>{app.candidateName || 'Unknown'}</strong>
                              <span style={{ marginLeft: '12px', color: '#555' }}>
                                {app.candidateEmail || 'N/A'}
                              </span>
                            </div>
                            <div style={styles.applicantActions}>
                              <span style={getStatusBadgeStyle(app.status)}>
                                {app.status}
                              </span>
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
                              <button
                                onClick={() => toggleInterviewForm(app.id)}
                                style={styles.interviewBtn}
                              >
                                {showInterviewForm === app.id ? 'Hide Interview' : 'Schedule Interview'}
                              </button>
                            </div>
                          </div>

                          {/* Interview Form */}
                          {showInterviewForm === app.id && (
                            <div style={styles.interviewSection}>
                              <div style={styles.interviewForm}>
                                <h5>Schedule Interview</h5>
                                <div style={styles.interviewRow}>
                                  <div style={styles.interviewGroup}>
                                    <label>Date & Time *</label>
                                    <input
                                      type="datetime-local"
                                      value={interviewData[app.id]?.scheduledAt || ''}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'scheduledAt', e.target.value)}
                                      style={styles.interviewInput}
                                    />
                                  </div>
                                  <div style={styles.interviewGroup}>
                                    <label>Duration (minutes)</label>
                                    <input
                                      type="number"
                                      value={interviewData[app.id]?.durationMinutes || 60}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'durationMinutes', e.target.value)}
                                      style={styles.interviewInput}
                                      min="15"
                                      step="5"
                                    />
                                  </div>
                                </div>
                                <div style={styles.interviewRow}>
                                  <div style={styles.interviewGroup}>
                                    <label>Interviewer User ID *</label>
                                    <input
                                      type="text"
                                      value={interviewData[app.id]?.interviewerUserId || ''}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'interviewerUserId', e.target.value)}
                                      style={styles.interviewInput}
                                      placeholder="Enter HiringManager's GUID"
                                    />
                                  </div>
                                </div>
                                <div style={styles.interviewRow}>
                                  <div style={styles.interviewGroup}>
                                    <label>Notes</label>
                                    <textarea
                                      value={interviewData[app.id]?.notes || ''}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'notes', e.target.value)}
                                      style={styles.interviewTextarea}
                                      rows={2}
                                      placeholder="Optional notes for the interview"
                                    />
                                  </div>
                                </div>
                                <div style={styles.interviewActions}>
                                  <button
                                    onClick={() => handleScheduleInterview(app.id)}
                                    disabled={submitting}
                                    style={styles.confirmInterviewBtn}
                                  >
                                    {submitting ? 'Scheduling...' : 'Confirm Schedule'}
                                  </button>
                                  <button
                                    onClick={() => toggleInterviewForm(app.id)}
                                    style={styles.cancelInterviewBtn}
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {interviewMessage[app.id] && (
                                  <p style={interviewMessage[app.id].type === 'success' ? styles.success : styles.error}>
                                    {interviewMessage[app.id].text}
                                  </p>
                                )}
                              </div>

                              {/* Existing Interviews */}
                              <div style={styles.existingInterviews}>
                                <h5>Existing Interviews</h5>
                                {fetchingInterviews[app.id] ? (
                                  <p>Loading interviews...</p>
                                ) : interviewsData[app.id] && interviewsData[app.id].length > 0 ? (
                                  <table style={styles.interviewTable}>
                                    <thead>
                                      <tr>
                                        <th>Date/Time</th>
                                        <th>Duration</th>
                                        <th>Interviewer</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {interviewsData[app.id].map((interview) => (
                                        <tr key={interview.id}>
                                          <td>{new Date(interview.scheduledAt).toLocaleString()}</td>
                                          <td>{interview.durationMinutes} min</td>
                                          <td>{interview.interviewerName || 'Unknown'}</td>
                                          <td>
                                            <span style={getInterviewStatusBadgeStyle(interview.status)}>
                                              {interview.status}
                                            </span>
                                          </td>
                                          <td>{interview.notes || '-'}</td>
                                          <td>
                                            {interview.status !== 'Completed' && interview.status !== 'Cancelled' && (
                                              <button
                                                onClick={() => handleMarkComplete(interview.id, app.id)}
                                                style={styles.completeBtn}
                                              >
                                                Mark Complete
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p>No interviews scheduled yet.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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

// Styles
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
  primaryBtn: {
    padding: '8px 16px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  form: {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: '#f9f9f9',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
  },
  formGroup: {
    flex: '1',
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  },
  jobCard: {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#fafafa',
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    margin: '0 0 8px 0',
  },
  jobDetail: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#555',
  },
  activeBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    backgroundColor: '#4caf50',
    color: '#fff',
  },
  inactiveBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    backgroundColor: '#f44336',
    color: '#fff',
  },
  applicantsSection: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
  applicantCard: {
    padding: '12px',
    border: '1px solid #eee',
    borderRadius: '4px',
    marginBottom: '8px',
    backgroundColor: '#fafafa',
  },
  applicantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  applicantActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statusSelect: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  interviewBtn: {
    padding: '4px 12px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  interviewSection: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
  interviewForm: {
    paddingBottom: '12px',
    borderBottom: '1px solid #eee',
    marginBottom: '12px',
  },
  interviewRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  interviewGroup: {
    flex: '1',
    minWidth: '180px',
  },
  interviewInput: {
    width: '100%',
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '13px',
  },
  interviewTextarea: {
    width: '100%',
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
    fontSize: '13px',
  },
  interviewActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  confirmInterviewBtn: {
    padding: '6px 16px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelInterviewBtn: {
    padding: '6px 16px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  existingInterviews: {
    marginTop: '8px',
  },
  interviewTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  completeBtn: {
    padding: '2px 10px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
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

  aiRankingSection: {
  marginTop: '16px',
  padding: '12px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
},
aiRankingBtn: {
  padding: '6px 16px',
  backgroundColor: '#9c27b0',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
},
aiRankingContent: {
  marginTop: '12px',
  padding: '12px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
},
aiRankingInfo: {
  margin: '0 0 12px 0',
  fontSize: '14px',
  color: '#333',
},
loadingText: {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center',
  padding: '20px 0',
},
noRankingData: {
  color: '#999',
  fontSize: '14px',
  textAlign: 'center',
  padding: '20px 0',
},
rankedCandidate: {
  display: 'flex',
  alignItems: 'center',
  padding: '10px',
  borderBottom: '1px solid #eee',
  gap: '16px',
},
rankNumber: {
  fontWeight: 'bold',
  fontSize: '16px',
  color: '#555',
  minWidth: '40px',
},
rankedInfo: {
  flex: '1',
},
rankedName: {
  fontWeight: '500',
  fontSize: '15px',
  color: '#1a1a2e',
},
rankedEmail: {
  fontSize: '13px',
  color: '#666',
},
rankedSkills: {
  fontSize: '13px',
  color: '#555',
  marginTop: '2px',
},
rankedScore: {
  minWidth: '60px',
  textAlign: 'right',
},

filterSection: {
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
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
  minWidth: '200px',
},
searchInput: {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  boxSizing: 'border-box',
},
filterGroup: {
  flex: '1',
  minWidth: '150px',
},
filterSelect: {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
  cursor: 'pointer',
},
filterCount: {
  marginTop: '8px',
  fontSize: '13px',
  color: '#666',
},
clearFiltersBtn: {
  padding: '8px 16px',
  backgroundColor: '#6c757d',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  whiteSpace: 'nowrap',
},

};

export default RecruiterPortalPage;