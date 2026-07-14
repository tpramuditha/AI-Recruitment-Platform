import CalendarView from '../../components/CalendarView';
import './AdminInterviewsPage.css';

const AdminInterviewsPage = () => {
  return (
    <div className="admin-interviews-container">
      <h1 className="admin-interviews-title">All Interviews Calendar</h1>
      <p className="admin-interviews-subtitle">View all interviews scheduled across the platform</p>
      <CalendarView role="Admin" />
    </div>
  );
};

export default AdminInterviewsPage;