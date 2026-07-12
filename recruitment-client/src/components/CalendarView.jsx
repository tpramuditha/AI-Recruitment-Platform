import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import apiClient from '../services/apiClient';

const CalendarView = ({ role }) => {
  const [interviews, setInterviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await apiClient.get('/Interviews/calendar');
      setInterviews(response.data);
    } catch (err) {
      setError('Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  };

  // Get dates that have interviews
  const getInterviewDates = () => {
    const dates = interviews.map(i => new Date(i.scheduledAt));
    return dates;
  };

  // Get interviews for a specific day
  const getInterviewsForDate = (date) => {
    return interviews.filter(i => {
      const d = new Date(i.scheduledAt);
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });
  };

  // Tile content to show red dot on dates with interviews
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasInterview = interviews.some(i => {
        const d = new Date(i.scheduledAt);
        return d.getFullYear() === date.getFullYear() &&
               d.getMonth() === date.getMonth() &&
               d.getDate() === date.getDate();
      });
      if (hasInterview) {
        return <div style={{ color: 'red', fontSize: '20px', marginTop: '-10px' }}>•</div>;
      }
    }
    return null;
  };

  // Tile class name to highlight date (optional)
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const hasInterview = interviews.some(i => {
        const d = new Date(i.scheduledAt);
        return d.getFullYear() === date.getFullYear() &&
               d.getMonth() === date.getMonth() &&
               d.getDate() === date.getDate();
      });
      return hasInterview ? 'interview-date' : '';
    }
    return null;
  };

  // Handle date click: show interviews for that day
  const onDateClick = (value) => {
    setSelectedDate(value);
  };

  const selectedInterviews = getInterviewsForDate(selectedDate);

  if (loading) return <div>Loading calendar...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h3>Interview Calendar</h3>
      <Calendar
        onChange={onDateClick}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        locale="en-US"
      />
      <div style={styles.details}>
        <h4>
          Interviews on {format(selectedDate, 'MMMM d, yyyy')}
        </h4>
        {selectedInterviews.length === 0 ? (
          <p>No interviews scheduled for this day.</p>
        ) : (
          <ul style={styles.list}>
            {selectedInterviews.map((i) => (
              <li key={i.id} style={styles.listItem}>
                <strong>{i.jobTitle}</strong> with {i.candidateName}
                <br />
                <span style={styles.time}>
                  {format(new Date(i.scheduledAt), 'h:mm a')} ({i.durationMinutes} min)
                </span>
                <br />
                <span style={styles.interviewer}>
                  Interviewer: {i.interviewerName}
                </span>
                <span style={styles.status}>Status: {i.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '20px auto',
  },
  details: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    marginBottom: '5px',
  },
  time: {
    color: '#555',
    fontSize: '14px',
  },
  interviewer: {
    color: '#1a73e8',
    fontSize: '14px',
  },
  status: {
    display: 'inline-block',
    marginLeft: '10px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#4caf50',
    color: '#fff',
  },
};

export default CalendarView;