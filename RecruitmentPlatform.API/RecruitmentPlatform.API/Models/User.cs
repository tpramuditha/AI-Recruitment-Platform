using System.ComponentModel.DataAnnotations;

namespace RecruitmentPlatform.API.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty; // will store hashed password

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "Candidate"; // "Candidate", "Recruiter", "HiringManager", "Admin"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Job> Jobs { get; set; } = new List<Job>();

    }
}