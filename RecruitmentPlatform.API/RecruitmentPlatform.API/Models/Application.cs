using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentPlatform.API.Models
{
    public class Application
    {
        [Key]
        public int Id { get; set; } // Auto-incrementing integer primary key

        [Required]
        public int JobId { get; set; }

        [Required]
        public int CandidateId { get; set; }

        [Required]
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Submitted"; // Submitted, UnderReview, Shortlisted, Rejected, Hired

        // Navigation properties
        [ForeignKey("JobId")]
        public Job? Job { get; set; }

        [ForeignKey("CandidateId")]
        public Candidate? Candidate { get; set; }
    }
}