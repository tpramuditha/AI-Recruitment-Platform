import CalendarView from '../../components/CalendarView';
import './ManagerInterviewsPage.css';

const ManagerInterviewsPage = () => {
  return (
    <div className="manager-interviews-container">
      <h1 className="manager-interviews-title">My Interview Schedule</h1>
      <CalendarView role="HiringManager" />
    </div>
  );
};

export default ManagerInterviewsPage;