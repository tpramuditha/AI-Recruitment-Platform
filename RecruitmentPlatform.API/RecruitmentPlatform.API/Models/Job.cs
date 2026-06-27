using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static System.Net.Mime.MediaTypeNames;

namespace RecruitmentPlatform.API.Models
{
    public class Job
    {
        [Key]
        public int Id { get; set; } // Auto-incrementing integer primary key

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Department { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Location { get; set; } = string.Empty; // e.g., "Remote", "Hybrid", "New York"

        [Required]
        [MaxLength(20)]
        public string EmploymentType { get; set; } = "FullTime"; // "FullTime", "PartTime", "Contract", "Internship"

        [MaxLength(2000)]
        public string RequiredSkills { get; set; } = string.Empty; // Store as comma-separated or JSON string

        // Foreign key to the User (Recruiter) who posted this job
        [Required]
        public Guid PostedByUserId { get; set; }

        [Required]
        public DateTime PostedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        // Navigation properties
        [ForeignKey("PostedByUserId")]
        public User? PostedByUser { get; set; }

        public ICollection<Application> Applications { get; set; } = new List<Application>();
    }
}