import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const { user } = useAuth();

  // Get redirect path based on role (inline logic)
  const getRedirectPath = (role) => {
    switch (role) {
      case 'Admin': return '/admin';
      case 'Recruiter': return '/recruiter';
      case 'HiringManager': return '/manager';
      case 'Candidate': return '/candidate';
      default: return '/login';
    }
  };

  const redirectPath = user ? getRedirectPath(user.role) : '/login';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.icon}>🚫</h1>
        <h2 style={styles.title}>Access Denied</h2>
        <p style={styles.message}>
          You don't have permission to view this page.
        </p>
        {user && (
          <p style={styles.userInfo}>
            Your role: <strong>{user.role}</strong>
          </p>
        )}
        <Link to={redirectPath} style={styles.link}>
          Go back to your dashboard
        </Link>
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
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  title: {
    margin: '0 0 8px 0',
    color: '#d32f2f',
  },
  message: {
    margin: '0 0 16px 0',
    color: '#555',
  },
  userInfo: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '14px',
  },
  link: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
  },
};

export default UnauthorizedPage;