using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentPlatform.API.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(50)]
        public string? UserId { get; set; }          // Guid or "Anonymous"

        [MaxLength(255)]
        public string? UserEmail { get; set; }

        [MaxLength(50)]
        public string? UserRole { get; set; }

        [Required]
        [MaxLength(10)]
        public string Action { get; set; } = string.Empty; // GET, POST, PUT, DELETE

        [Required]
        [MaxLength(500)]
        public string Endpoint { get; set; } = string.Empty;

        [Required]
        public int StatusCode { get; set; }

        [MaxLength(45)]
        public string? IpAddress { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(2000)]
        public string? Details { get; set; }   // Extra info (e.g., request body or error)
    }
}