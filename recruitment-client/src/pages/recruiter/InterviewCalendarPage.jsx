import { useState, useEffect } from 'react';
import './InterviewCalendarPage.css';

const InterviewCalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock fetching interview data (Replace with your actual API fetch logic)
  useEffect(() => {
    setLoading(true);
    // Simulated API response of scheduled interviews
    const mockInterviews = [
      {
        id: 1,
        candidateName: 'Kamal Perera',
        jobTitle: 'QA Engineer',
        time: '10:00 AM - 11:00 AM',
        date: '2026-07-16', // Format: YYYY-MM-DD
        type: 'Technical Interview',
        link: 'https://meet.google.com/abc-defg-hij',
      },
      {
        id: 2,
        candidateName: 'Nimal Fernando',
        jobTitle: 'Software Engineer',
        time: '02:00 PM - 03:00 PM',
        date: '2026-07-16',
        type: 'Managerial Round',
        link: 'https://meet.google.com/xyz-pdq-rst',
      },
      {
        id: 3,
        candidateName: 'Namal Kumara',
        jobTitle: 'DevOps Specialist',
        time: '11:30 AM - 12:30 PM',
        date: '2026-07-20',
        type: 'HR Screening',
        link: 'https://meet.google.com/mno-uvwx-yz',
      }
    ];

    setInterviews(mockInterviews);
    setLoading(false);
  }, []);

  // Format Helper
  const formatDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const selectedDateStr = formatDateString(selectedDate);

  // Filter interviews for the selected day
  const activeInterviews = interviews.filter(item => item.date === selectedDateStr);

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysAmount = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month's empty days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of current month
    for (let d = 1; d <= daysAmount; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="recruiter-calendar-container">
      <div className="calendar-header-section">
        <h2 className="calendar-main-title">Interview Calendar</h2>
        <p className="calendar-subtitle">Manage and track candidate screening panels</p>
      </div>

      <div className="calendar-workspace">
        {/* Left Hand: Interactive Grid Card */}
        <div className="calendar-card">
          <div className="calendar-nav-bar">
            <button onClick={handlePrevMonth} className="calendar-nav-btn">‹</button>
            <span className="calendar-month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="calendar-nav-btn">›</button>
          </div>

          <div className="calendar-grid-labels">
            <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
          </div>

          <div className="calendar-grid-days">
            {getDaysInMonth().map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="calendar-day empty"></div>;
              
              const dayStr = formatDateString(day);
              const isSelected = dayStr === selectedDateStr;
              const hasInterviews = interviews.some(item => item.date === dayStr);
              const isToday = formatDateString(new Date()) === dayStr;

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={`calendar-day-btn 
                    ${isSelected ? 'selected' : ''} 
                    ${isToday ? 'today' : ''} 
                    ${hasInterviews ? 'has-event' : ''}`}
                >
                  <span className="day-number">{day.getDate()}</span>
                  {hasInterviews && <span className="event-dot"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Hand: Schedule Detail Board */}
        <div className="schedule-panel">
          <h3 className="schedule-panel-title">
            Interviews on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>

          {loading ? (
            <div className="schedule-empty-state">Loading interviews...</div>
          ) : activeInterviews.length > 0 ? (
            <div className="schedule-list">
              {activeInterviews.map((meet) => (
                <div key={meet.id} className="schedule-item-card">
                  <div className="schedule-item-accent"></div>
                  <div className="schedule-item-details">
                    <div className="schedule-meta-row">
                      <span className="schedule-badge">{meet.type}</span>
                      <span className="schedule-time-label">🕒 {meet.time}</span>
                    </div>
                    <h4 className="schedule-candidate-name">{meet.candidateName}</h4>
                    <p className="schedule-position-text">Applying for: <strong>{meet.jobTitle}</strong></p>
                    {meet.link && (
                      <a 
                        href={meet.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="schedule-link-btn"
                      >
                        🎥 Join Virtual Interview
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="schedule-empty-state">
              <span className="empty-state-icon">☕</span>
              <p className="empty-state-text">No interviews scheduled for this day.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewCalendarPage;