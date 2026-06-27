import { useState } from 'react';
import { login } from './services/authService';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const data = await login(email, password);
      setResult(data);
    } catch (err) {
      setError('Login failed. Check your email and password.');
    }
  };

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

      {result && (
        <div style={{ marginTop: '20px', padding: '12px', background: '#eef', borderRadius: '4px' }}>
          <strong>Login successful!</strong>
          <p>Welcome, {result.user.fullName} ({result.user.role})</p>
          <p style={{ fontSize: '11px', wordBreak: 'break-all' }}>Token: {result.token}</p>
        </div>
      )}
    </div>
  );
}

export default App;