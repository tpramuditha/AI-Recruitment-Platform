import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import './CandidateJobsPage.css';

const CandidateJobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
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

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    setApplyMessage('');
    try {
      await apiClient.post('/Applications', { jobId });
      setApplyMessage('✅ Application submitted successfully!');
      setTimeout(() => setApplyMessage(''), 3000);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to apply.';
      setApplyMessage(`❌ Error: ${message}`);
    } finally {
      setApplyingJobId(null);
    }
  };

  if (loading) {
    return <div className="candidate-jobs-loading">Loading jobs...</div>;
  }

  return (
    <div className="candidate-jobs-container">
      <h1 className="candidate-jobs-title">Available Jobs</h1>

      {error && <div className="candidate-jobs-error">{error}</div>}
      {applyMessage && <div className={applyMessage.startsWith('✅') ? 'candidate-jobs-success' : 'candidate-jobs-error'}>{applyMessage}</div>}

      {jobs.length === 0 ? (
        <p>No jobs available at the moment.</p>
      ) : (
        <div className="candidate-jobs-grid">
          {jobs.map((job) => (
            <div key={job.id} className="candidate-job-card">
              <h3 className="candidate-job-title">{job.title}</h3>
              <p className="candidate-job-detail"><strong>Department:</strong> {job.department}</p>
              <p className="candidate-job-detail"><strong>Location:</strong> {job.location}</p>
              <p className="candidate-job-detail"><strong>Type:</strong> {job.employmentType}</p>
              <p className="candidate-job-detail"><strong>Skills:</strong> {job.requiredSkills || 'Not specified'}</p>
              <button
                onClick={() => handleApply(job.id)}
                disabled={applyingJobId === job.id}
                className="candidate-apply-btn"
              >
                {applyingJobId === job.id ? 'Applying...' : 'Apply'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateJobsPage;