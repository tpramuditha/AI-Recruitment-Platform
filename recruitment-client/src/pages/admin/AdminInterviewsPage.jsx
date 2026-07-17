import CalendarView from '../../components/CalendarView';
import './AdminInterviewsPage.css';

const AdminInterviewsPage = () => {
  return (
    <div className="pf-view-container animate-fade-in">
      <h1 className="pf-view-title">Master Interview Schedule</h1>
      <p className="pf-view-subtitle">Cross-platform validation of all active structural assessment sessions</p>
      
      <div className="pf-calendar-card-frame">
        <CalendarView role="Admin" />
      </div>
    </div>
  );
};

export default AdminInterviewsPage;