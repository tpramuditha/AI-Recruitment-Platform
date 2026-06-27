// src/App.jsx
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { login as apiLogin } from './services/authService';
import CandidatesList from './components/CandidatesList';

function App() {
  const { user, login, logout, isAuthenticated } = useAuth();

  // Local state for the login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await apiLogin(email, password);
      // data should contain { token, user: { id, fullName, email, role } }
      login(data.user, data.token);
    } catch (err) {
      setError('Login failed. Check your credentials.');
    }
  };

  const handleLogout = () => {
    logout();
  };

  // If logged in, show the CandidatesList and a logout button
  if (isAuthenticated) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Recruitment Platform</h1>
          <div>
            <span>Welcome, {user.fullName} ({user.role})</span>
            <button onClick={handleLogout} style={{ marginLeft: '16px', padding: '6px 12px' }}>
              Logout
            </button>
          </div>
        </div>
        <CandidatesList />
      </div>
    );
  }

  // Otherwise, show login form
  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1>Recruitment Platform</h1>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '12px' }}>
          <label>Email</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Password</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" style={{ padding: '8px 16px' }}>
          Log In
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;