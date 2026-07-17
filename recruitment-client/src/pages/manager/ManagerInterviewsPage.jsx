import CalendarView from '../../components/CalendarView';
import './ManagerInterviewsPage.css';

const ManagerInterviewsPage = () => {
  return (
    <div className="pf-page-fluid-wrapper animate-fade-in">
      <div className="pf-view-header-block">
        <div>
          <h1 className="pf-main-view-title">My Interview Schedule</h1>
          <p className="pf-main-view-subtitle">Manage upcoming technical assessment panels and pipeline timelines</p>
        </div>
      </div>
      
      <div className="pf-calendar-workspace-card">
        <CalendarView role="HiringManager" />
      </div>
    </div>
  );
};

export default ManagerInterviewsPage;