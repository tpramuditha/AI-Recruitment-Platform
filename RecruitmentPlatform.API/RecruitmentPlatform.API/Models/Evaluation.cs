using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentPlatform.API.Models
{
    public class Evaluation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ApplicationId { get; set; }

        [Required]
        public Guid EvaluatedByUserId { get; set; }

        [Required]
        [Range(1, 5)]
        public int TechnicalScore { get; set; } // 1-5

        [Required]
        [Range(1, 5)]
        public int CommunicationScore { get; set; } // 1-5

        [Required]
        [Range(1, 5)]
        public int CultureFitScore { get; set; } // 1-5

        [MaxLength(2000)]
        public string? Feedback { get; set; }

        [Required]
        [MaxLength(20)]
        public string Recommendation { get; set; } = "NextRound"; // Hire, NoHire, NextRound

        [Required]
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ApplicationId")]
        public Application? Application { get; set; }

        [ForeignKey("EvaluatedByUserId")]
        public User? EvaluatedByUser { get; set; }
    }
}