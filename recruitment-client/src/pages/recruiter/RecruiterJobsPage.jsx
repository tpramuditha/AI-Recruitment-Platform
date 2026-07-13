import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import CalendarView from '../../components/CalendarView';
import './RecruiterJobsPage.css'; // We'll create this next

const RecruiterJobsPage = () => {
  const { user } = useAuth();
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // AI Ranking states
  const [showAiRanking, setShowAiRanking] = useState(false);
  const [aiRankingData, setAiRankingData] = useState(null);
  const [loadingAiRanking, setLoadingAiRanking] = useState(false);
  const [aiRankingError, setAiRankingError] = useState('');

  // Interview states
  const [showInterviewForm, setShowInterviewForm] = useState(null);
  const [interviewData, setInterviewData] = useState({});
  const [interviewMessage, setInterviewMessage] = useState({});
  const [fetchingInterviews, setFetchingInterviews] = useState({});
  const [interviewsData, setInterviewsData] = useState({});

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

  const handleViewApplicants = async (jobId) => {
    setSelectedJobId(jobId);
    setSearchTerm('');
    setStatusFilter('All');
    setShowAiRanking(false);
    setAiRankingData(null);
    setAiRankingError('');

    try {
      const response = await apiClient.get(`/Applications/job/${jobId}`);
      setApplicants(response.data);
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

      setInterviewData({ ...interviewData, [applicationId]: {} });
      await fetchInterviews(applicationId);

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
    if (score >= 70) {
      color = 'green';
    } else if (score >= 40) {
      color = 'orange';
    } else {
      color = 'grey';
    }
    return `recruiter-match-badge ${color}`;
  };

  const filteredApplicants = applicants.filter((app) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = app.candidateName?.toLowerCase().includes(searchLower) || false;
    const emailMatch = app.candidateEmail?.toLowerCase().includes(searchLower) || false;
    const searchMatch = searchTerm === '' || nameMatch || emailMatch;
    const statusMatch = statusFilter === 'All' || app.status === statusFilter;
    return searchMatch && statusMatch;
  });

  if (loading) {
    return <div className="recruiter-loading">Loading...</div>;
  }

  return (
    <div className="recruiter-jobs-container">
      {error && <div className="recruiter-error">{error}</div>}

      {/* Job List */}
      <section className="recruiter-section">
        <div className="recruiter-section-header">
          <h2>Your Jobs</h2>
        </div>

        {jobs.length === 0 ? (
          <p>You haven't posted any jobs yet. <a href="/recruiter/post-job">Post your first job!</a></p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="recruiter-job-card">
              <div className="recruiter-job-header">
                <h3 className="recruiter-job-title">{job.title}</h3>
                <span className={job.isActive ? 'recruiter-active-badge' : 'recruiter-inactive-badge'}>
                  {job.isActive ? 'Active' : 'Closed'}
                </span>
              </div>
              <p className="recruiter-job-detail"><strong>Department:</strong> {job.department}</p>
              <p className="recruiter-job-detail"><strong>Location:</strong> {job.location}</p>
              <p className="recruiter-job-detail"><strong>Type:</strong> {job.employmentType}</p>
              <button
                onClick={() => handleViewApplicants(job.id)}
                className="recruiter-secondary-btn"
              >
                View Applicants
              </button>

              {/* Applicants List */}
              {selectedJobId === job.id && (
                <div className="recruiter-applicants-section">
                  <h4>Applicants</h4>

                  {/* Search and Filter */}
                  <div className="recruiter-filter-section">
                    <div className="recruiter-filter-row">
                      <div className="recruiter-search-group">
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="recruiter-search-input"
                        />
                      </div>
                      <div className="recruiter-filter-group">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="recruiter-filter-select"
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
                        className="recruiter-clear-filters-btn"
                      >
                        Clear Filters
                      </button>
                    </div>
                    <div className="recruiter-filter-count">
                      Showing {filteredApplicants.length} of {applicants.length} applicants
                    </div>
                  </div>

                  {/* AI Ranking Section */}
                  <div className="recruiter-ai-ranking-section">
                    <button
                      onClick={() => handleAiRanking(job.id)}
                      className="recruiter-ai-ranking-btn"
                    >
                      {showAiRanking ? 'Hide AI Ranking' : 'Show AI Ranking'}
                    </button>

                    {showAiRanking && (
                      <div className="recruiter-ai-ranking-content">
                        {loadingAiRanking ? (
                          <p className="recruiter-loading-text">Calculating AI ranking...</p>
                        ) : aiRankingError ? (
                          <p className="recruiter-error">{aiRankingError}</p>
                        ) : aiRankingData && aiRankingData.rankedCandidates && aiRankingData.rankedCandidates.length > 0 ? (
                          <div>
                            <p className="recruiter-ai-ranking-info">
                              <strong>{aiRankingData.totalCandidates}</strong> candidates ranked for
                              <strong> {aiRankingData.jobTitle}</strong>
                            </p>
                            {aiRankingData.rankedCandidates.map((candidate, index) => (
                              <div key={candidate.candidateId} className="recruiter-ranked-candidate">
                                <div className="recruiter-rank-number">#{index + 1}</div>
                                <div className="recruiter-ranked-info">
                                  <div className="recruiter-ranked-name">{candidate.fullName || 'Unknown'}</div>
                                  <div className="recruiter-ranked-email">{candidate.email || 'N/A'}</div>
                                  <div className="recruiter-ranked-skills">
                                    <strong>Skills:</strong> {candidate.skills || 'Not specified'}
                                  </div>
                                </div>
                                <div className="recruiter-ranked-score">
                                  <span className={getMatchScoreBadgeStyle(candidate.matchScore)}>
                                    {candidate.matchPercentage || '0%'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="recruiter-no-ranking-data">
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
                        <div key={app.id} className="recruiter-applicant-card">
                          <div className="recruiter-applicant-header">
                            <div>
                              <strong>{app.candidateName || 'Unknown'}</strong>
                              <span style={{ marginLeft: '12px', color: '#555' }}>
                                {app.candidateEmail || 'N/A'}
                              </span>
                            </div>
                            <div className="recruiter-applicant-actions">
                              <span style={getStatusBadgeStyle(app.status)}>
                                {app.status}
                              </span>
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                className="recruiter-status-select"
                              >
                                <option value="Submitted">Submitted</option>
                                <option value="UnderReview">Under Review</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Hired">Hired</option>
                              </select>
                              <button
                                onClick={() => toggleInterviewForm(app.id)}
                                className="recruiter-interview-btn"
                              >
                                {showInterviewForm === app.id ? 'Hide Interview' : 'Schedule Interview'}
                              </button>
                            </div>
                          </div>

                          {/* Interview Form */}
                          {showInterviewForm === app.id && (
                            <div className="recruiter-interview-section">
                              <div className="recruiter-interview-form">
                                <h5>Schedule Interview</h5>
                                <div className="recruiter-interview-row">
                                  <div className="recruiter-interview-group">
                                    <label>Date & Time *</label>
                                    <input
                                      type="datetime-local"
                                      value={interviewData[app.id]?.scheduledAt || ''}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'scheduledAt', e.target.value)}
                                      className="recruiter-interview-input"
                                    />
                                  </div>
                                  <div className="recruiter-interview-group">
                                    <label>Duration (minutes)</label>
                                    <input
                                      type="number"
                                      value={interviewData[app.id]?.durationMinutes || 60}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'durationMinutes', e.target.value)}
                                      className="recruiter-interview-input"
                                      min="15"
                                      step="5"
                                    />
                                  </div>
                                </div>
                                <div className="recruiter-interview-row">
                                  <div className="recruiter-interview-group">
                                    <label>Interviewer User ID *</label>
                                    <input
                                      type="text"
                                      value={interviewData[app.id]?.interviewerUserId || ''}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'interviewerUserId', e.target.value)}
                                      className="recruiter-interview-input"
                                      placeholder="Enter HiringManager's GUID"
                                    />
                                  </div>
                                </div>
                                <div className="recruiter-interview-row">
                                  <div className="recruiter-interview-group">
                                    <label>Notes</label>
                                    <textarea
                                      value={interviewData[app.id]?.notes || ''}
                                      onChange={(e) => handleInterviewInputChange(app.id, 'notes', e.target.value)}
                                      className="recruiter-interview-textarea"
                                      rows={2}
                                      placeholder="Optional notes for the interview"
                                    />
                                  </div>
                                </div>
                                <div className="recruiter-interview-actions">
                                  <button
                                    onClick={() => handleScheduleInterview(app.id)}
                                    disabled={submitting}
                                    className="recruiter-confirm-interview-btn"
                                  >
                                    {submitting ? 'Scheduling...' : 'Confirm Schedule'}
                                  </button>
                                  <button
                                    onClick={() => toggleInterviewForm(app.id)}
                                    className="recruiter-cancel-interview-btn"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {interviewMessage[app.id] && (
                                  <p className={interviewMessage[app.id].type === 'success' ? 'recruiter-success' : 'recruiter-error'}>
                                    {interviewMessage[app.id].text}
                                  </p>
                                )}
                              </div>

                              {/* Existing Interviews */}
                              <div className="recruiter-existing-interviews">
                                <h5>Existing Interviews</h5>
                                {fetchingInterviews[app.id] ? (
                                  <p>Loading interviews...</p>
                                ) : interviewsData[app.id] && interviewsData[app.id].length > 0 ? (
                                  <table className="recruiter-interview-table">
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
                                                className="recruiter-complete-btn"
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

      {/* Interview Calendar */}
      <section className="recruiter-section">
        <h2>Interview Calendar</h2>
        <CalendarView role="Recruiter" />
      </section>
    </div>
  );
};

export default RecruiterJobsPage;