import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await apiClient.get('/Candidates'); // GET /api/Candidates
        setCandidates(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load candidates. Make sure you are logged in.');
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  if (loading) {
    return <p>Loading candidates...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Candidates List</h2>
      {candidates.length === 0 ? (
        <p>No candidates found.</p>
      ) : (
        <ul>
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <strong>{candidate.fullName}</strong> – {candidate.email}
              {candidate.skills && <span> (Skills: {candidate.skills})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CandidatesList;