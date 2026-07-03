// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',      // NEW
    password: '',
    confirmPassword: '',
    role: 'Candidate',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiRegister(
        formData.fullName,
        formData.email,
        formData.phoneNumber,
        formData.password,
        formData.role
      );
      setSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'Candidate',
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Recruitment Platform</h1>
        <h2 style={styles.subtitle}>Create an Account</h2>

        {success ? (
          <div style={styles.successBox}>
            <p style={styles.successMessage}>✅ Registration successful!</p>
            <p style={styles.redirectMessage}>Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={styles.field}>
              <label style={styles.label}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Phone Number (NEW) */}
            <div style={styles.field}>
              <label style={styles.label}>Phone Number (optional)</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                placeholder="e.g. +94 77 1234567"
              />
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label}>Password * (min 6 characters)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div style={styles.field}>
              <label style={styles.label}>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Role */}
            <div style={styles.field}>
              <label style={styles.label}>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={styles.select}
                disabled={loading}
              >
                <option value="Candidate">Candidate</option>
                <option value="Recruiter">Recruiter</option>
                <option value="HiringManager">Hiring Manager</option>
              </select>
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.loginLink}>
          <p>
            Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// (styles remain the same as previous version)
const styles = {
  // ... same styles as before (copy from earlier)
  // Ensure include all styles used above
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'sans-serif',
  },
  card: {
    maxWidth: '420px',
    width: '100%',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    color: '#1a1a2e',
    fontSize: '24px',
  },
  subtitle: {
    margin: '0 0 24px 0',
    color: '#555',
    fontSize: '18px',
    fontWeight: 'normal',
  },
  field: {
    marginBottom: '16px',
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
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#d32f2f',
    marginTop: '12px',
    fontSize: '14px',
    textAlign: 'center',
  },
  successBox: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successMessage: {
    color: '#2e7d32',
    fontSize: '18px',
    fontWeight: '500',
    margin: 0,
  },
  redirectMessage: {
    color: '#555',
    fontSize: '14px',
    marginTop: '8px',
  },
  loginLink: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#1a73e8',
    textDecoration: 'none',
  },
};

export default RegisterPage;