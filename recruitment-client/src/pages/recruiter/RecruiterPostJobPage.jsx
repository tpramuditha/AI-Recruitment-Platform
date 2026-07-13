import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './RecruiterPostJobPage.css'; // We'll create this next

const RecruiterPostJobPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    employmentType: 'FullTime',
    requiredSkills: '',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/Jobs', formData);
      setSuccess('✅ Job posted successfully!');
      setFormData({
        title: '',
        description: '',
        department: '',
        location: '',
        employmentType: 'FullTime',
        requiredSkills: '',
      });
      setTimeout(() => navigate('/recruiter/jobs'), 2000);
    } catch (err) {
      setError('Failed to create job.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="recruiter-post-job-container">
      <h1 className="recruiter-post-job-title">Post New Job</h1>
      <p className="recruiter-post-job-subtitle">Fill in the details below to create a new job posting</p>

      {error && <div className="recruiter-error">{error}</div>}
      {success && <div className="recruiter-success">{success}</div>}

      <form onSubmit={handleSubmit} className="recruiter-post-job-form">
        <div className="recruiter-form-row">
          <div className="recruiter-form-group">
            <label>Job Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g. Senior Software Engineer"
              className="recruiter-input"
            />
          </div>
          <div className="recruiter-form-group">
            <label>Department *</label>
            <input
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              placeholder="e.g. Engineering"
              className="recruiter-input"
            />
          </div>
        </div>

        <div className="recruiter-form-row">
          <div className="recruiter-form-group">
            <label>Location *</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="e.g. Colombo, Sri Lanka"
              className="recruiter-input"
            />
          </div>
          <div className="recruiter-form-group">
            <label>Employment Type</label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleInputChange}
              className="recruiter-select"
            >
              <option value="FullTime">Full Time</option>
              <option value="PartTime">Part Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>

        <div className="recruiter-form-group">
          <label>Job Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={5}
            placeholder="Describe the role, responsibilities, and requirements..."
            className="recruiter-textarea"
          />
        </div>

        <div className="recruiter-form-group">
          <label>Required Skills</label>
          <input
            name="requiredSkills"
            value={formData.requiredSkills}
            onChange={handleInputChange}
            placeholder="e.g. C#, React, MySQL, AWS"
            className="recruiter-input"
          />
          <span className="recruiter-hint">Separate skills with commas</span>
        </div>

        <div className="recruiter-button-row">
          <button
            type="submit"
            disabled={submitting}
            className="recruiter-submit-btn"
          >
            {submitting ? 'Posting...' : '📤 Post Job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/recruiter/jobs')}
            className="recruiter-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecruiterPostJobPage;