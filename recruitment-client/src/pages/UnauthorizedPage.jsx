import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pf-unauthorized-container">
      <div className="pf-unauthorized-card">
        <div className="pf-unauthorized-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        
        <h1 className="pf-form-title" style={{ marginBottom: '1rem' }}>Access Denied</h1>
        <p className="pf-form-subtitle" style={{ marginBottom: '2.5rem', lineHeight: '1.5' }}>
          It looks like you don't have permission to access this resource. Please make sure you are signed in with the correct role privileges.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/login')} className="pf-btn-primary">
            Back to Sign In
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className="pf-btn-primary" 
            style={{ backgroundColor: 'transparent', border: '1.5px solid var(--pf-border)', color: 'var(--pf-text-dark)' }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;