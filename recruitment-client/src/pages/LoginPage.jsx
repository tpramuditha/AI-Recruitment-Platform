import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import './AuthPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Fire the actual API call
      const response = await apiClient.post('/Auth/login', {
        email: formData.email,
        password: formData.password
      });

      // 2. Extract user and token exactly like your old code
      const { token, user } = response.data;

      // 3. Call login with both parameters as expected by your context
      if (login) {
        login(user, token);
      }

      // 4. Role-based redirection fully restored from your original code
      const role = user.role;
      if (role === 'Admin') {
        navigate('/admin');
      } else if (role === 'Recruiter') {
        navigate('/recruiter');
      } else if (role === 'HiringManager') {
        navigate('/manager');
      } else if (role === 'Candidate') {
        navigate('/candidate');
      } else {
        navigate('/');
      }

    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
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
          <h2 className="pf-banner-title">Empowering your hiring lifecycle.</h2>
          <p className="pf-banner-text">
            Join thousands of modern HR teams managing candidate streams, extracting technical capabilities with AI, and securing the best talent effortlessly.
          </p>
        </div>
        
        <div className="pf-banner-footer">
          &copy; {new Date().getFullYear()} Best Hire. All rights reserved.
        </div>
      </div>

      {/* Right side form */}
      <div className="pf-auth-form-side">
        <div className="pf-form-card">
          <h1 className="pf-form-title">Welcome back</h1>
          <p className="pf-form-subtitle">
            Don't have an account yet? <Link to="/register">Create an account</Link>
          </p>

          {error && <div className="pf-error-message">{error}</div>}

          <form onSubmit={handleLogin}>
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

            {/* PeopleForce styled contextual actions link */}
            <div className="pf-form-actions-row">
              <button 
                type="button" 
                className="pf-link-btn" 
                onClick={() => toggleView('forgot')}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="pf-btn-primary">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;