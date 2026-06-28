using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentPlatform.API.Models
{
    public class Interview
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ApplicationId { get; set; }

        [Required]
        public DateTime ScheduledAt { get; set; }

        [Required]
        public int DurationMinutes { get; set; } = 60; // Default 60 minutes

        [Required]
        public Guid InterviewerUserId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled

        [MaxLength(2000)]
        public string? Notes { get; set; } // Interview notes/feedback

        // Navigation properties
        [ForeignKey("ApplicationId")]
        public Application? Application { get; set; }

        [ForeignKey("InterviewerUserId")]
        public User? InterviewerUser { get; set; }
    }
}