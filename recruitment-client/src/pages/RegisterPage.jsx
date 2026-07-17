import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../services/authService'; // Restored API service
import './AuthPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'Candidate' // Default role selection
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // Restored success state tracking
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // 1. Validation checks from your original working code
    if (!formData.fullName.trim()) {
      setError('❌ Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('❌ Email is required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('❌ Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('❌ Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 2. Fire the actual registration API call with individual parameters
      await apiRegister(
        formData.fullName,
        formData.email,
        formData.phoneNumber,
        formData.password,
        formData.role
      );
      
      setSuccess(true);
      
      // 3. Clear the form data upon successful creation
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'Candidate',
      });

      // 4. Delay navigation briefly so user sees confirmation message
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pf-auth-container">
      {/* Left side banner */}
      <div className="pf-auth-banner">
        <div className="pf-banner-blob blob-1"></div>
        <div className="pf-banner-blob blob-2"></div>
        
        <div className="pf-banner-header">
          <div className="pf-app-logo">
            Best<span>Hire</span>
          </div>
        </div>
        
        <div className="pf-banner-body">
          <h2 className="pf-banner-title">Build your ultimate dream team.</h2>
          <p className="pf-banner-text">
            Start automating candidate assessments, track interviews, and integrate structured hiring metrics from day one.
          </p>
        </div>
        
        <div className="pf-banner-footer">
          &copy; {new Date().getFullYear()} Best Hire. All rights reserved.
        </div>
      </div>

      {/* Right side form */}
      <div className="pf-auth-form-side">
        <div className="pf-form-card">
          <h1 className="pf-form-title">Create account</h1>
          <p className="pf-form-subtitle">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          {error && <div className="pf-error-message">{error}</div>}
          
          {/* Display nice message when registration succeeds */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h3 style={{ color: '#2e7d32', marginBottom: '8px' }}>✅ Registration successful!</h3>
              <p style={{ color: '#666' }}>Redirecting you to the login screen...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="pf-input-group">
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder=" "
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label>Full Name</label>
              </div>

              <div className="pf-input-group">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder=" "
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label>Email Address</label>
              </div>

              <div className="pf-input-group">
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder=" "
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label>Phone Number (optional)</label>
              </div>

              {/* Role Selection Dropdown */}
              <div className="pf-input-group">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1.5px solid var(--pf-border)',
                    borderRadius: 'var(--pf-radius)',
                    fontSize: '0.95rem',
                    color: 'var(--pf-text-dark)',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Candidate">Candidate</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="HiringManager">Hiring Manager</option>
                </select>
              </div>

              <div className="pf-input-group">
                <input
                  type="password"
                  name="password"
                  required
                  placeholder=" "
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label>Password</label>
              </div>

              <div className="pf-input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder=" "
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label>Confirm Password</label>
              </div>

              <button type="submit" disabled={loading} className="pf-btn-primary">
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;