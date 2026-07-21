using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Models;
using RecruitmentPlatform.API.Services;
using System.Security.Claims;

namespace RecruitmentPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AIMatchingService _aiMatchingService;
        private readonly GeminiService _geminiService; // ✅ correct name

        public AIController(ApplicationDbContext context, AIMatchingService aiMatchingService, GeminiService geminiService)
        {
            _context = context;
            _aiMatchingService = aiMatchingService;
            _geminiService = geminiService; // ✅ assign correctly
        }

        // GET: api/AI/jobs/recommended
        [HttpGet("jobs/recommended")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> GetRecommendedJobs()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email == user.Email);
            if (candidate == null)
                return BadRequest(new { message = "Candidate profile not found." });

            var jobs = await _context.Jobs
                .Where(j => j.IsActive)
                .ToListAsync();

            var recommendedJobs = new List<RecommendedJobDto>();

            foreach (var job in jobs)
            {
                double score = 0;
                try
                {
                    score = await _aiMatchingService.CalculateMatchScoreAsync(
                        candidate.Skills ?? "",
                        job.RequiredSkills ?? ""
                    );
                }
                catch
                {
                    score = _aiMatchingService.CalculateMatchScore(
                        candidate.Skills ?? "",
                        job.RequiredSkills ?? ""
                    );
                }

                recommendedJobs.Add(new RecommendedJobDto
                {
                    Id = job.Id,
                    Title = job.Title,
                    Description = job.Description,
                    Department = job.Department,
                    Location = job.Location,
                    EmploymentType = job.EmploymentType,
                    RequiredSkills = job.RequiredSkills,
                    PostedAt = job.PostedAt,
                    IsActive = job.IsActive,
                    MatchScore = Math.Round(score, 1),
                    MatchPercentage = $"{Math.Round(score, 1)}%"
                });
            }

            return Ok(recommendedJobs.OrderByDescending(j => j.MatchScore));
        }

        // ✅ POST: api/AI/extract-skills
        [HttpPost("extract-skills")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> ExtractSkills([FromBody] ExtractSkillsRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.ProfileText))
                    return BadRequest(new { message = "Profile text cannot be empty." });

                // ✅ Use _geminiService (with underscore)
                var extractedSkills = await _geminiService.ExtractSkillsAsync(request.ProfileText);

                var skillList = extractedSkills
                    ?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s) && s != "No skills identified")
                    .ToList() ?? new List<string>();

                return Ok(new
                {
                    extractedSkills = extractedSkills ?? "No skills identified",
                    skillList = skillList
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Skill extraction error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to extract skills. Please try again later." });
            }
        }
    }

    // DTO for recommended jobs
    public class RecommendedJobDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string RequiredSkills { get; set; } = string.Empty;
        public DateTime PostedAt { get; set; }
        public bool IsActive { get; set; }
        public double MatchScore { get; set; }
        public string MatchPercentage { get; set; } = string.Empty;
    }

    // DTO for skill extraction request
    public class ExtractSkillsRequest
    {
        public string ProfileText { get; set; } = string.Empty;
    }
}