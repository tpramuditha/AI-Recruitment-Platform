import CalendarView from '../../components/CalendarView';
import './CandidateInterviewsPage.css';

const CandidateInterviewsPage = () => {
  return (
    <div className="candidate-interviews-container">
      <h1 className="candidate-interviews-title">My Interviews</h1>
      <CalendarView role="Candidate" />
    </div>
  );
};

export default CandidateInterviewsPage;