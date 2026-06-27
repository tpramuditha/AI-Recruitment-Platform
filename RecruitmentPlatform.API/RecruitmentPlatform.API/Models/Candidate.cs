using System.ComponentModel.DataAnnotations;

namespace RecruitmentPlatform.API.Models
{
    public class Candidate
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        public string? Skills { get; set; }

        public string? ResumeFilePath { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Application> Applications { get; set; } = new 
            List<Application>();
    }
}