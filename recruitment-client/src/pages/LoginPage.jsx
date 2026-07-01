// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/authService';
import { getRedirectPath } from '../routes';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(email, password);
      login(data.user, data.token);
      
      // Redirect based on role
      const redirectPath = getRedirectPath(data.user.role);
      navigate(redirectPath);
    } catch (err) {
      setError('Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Recruitment Platform</h1>
        <h2 style={styles.subtitle}>Login</h2>

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.registerLink}>
          <p>Don't have an account? <a href="/register" style={styles.link}>Register here</a></p>
          <p style={styles.hint}>Demo: test@example.com / Test123!</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'sans-serif',
  },
  card: {
    maxWidth: '400px',
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
  registerLink: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#1a73e8',
    textDecoration: 'none',
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  }
};

export default LoginPage;