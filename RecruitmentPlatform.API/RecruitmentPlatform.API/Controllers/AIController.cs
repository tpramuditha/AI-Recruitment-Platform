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

        // GET: api/AI/candidates/ranked/{jobId}
        [HttpGet("candidates/ranked/{jobId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetRankedCandidates(int jobId)
        {
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            List<RankedCandidate> ranked;
            try
            {
                ranked = await _aiMatchingService.RankCandidatesForJobAsync(jobId);
            }
            catch
            {
                ranked = _aiMatchingService.RankCandidatesForJobSync(jobId);
            }

            return Ok(new
            {
                jobTitle = job.Title,
                totalCandidates = ranked.Count,
                rankedCandidates = ranked
            });
        }

        // GET: api/AI/match-score?candidateId=&jobId=
        [HttpGet("match-score")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetMatchScore([FromQuery] int candidateId, [FromQuery] int jobId)
        {
            var candidate = await _context.Candidates.FindAsync(candidateId);
            var job = await _context.Jobs.FindAsync(jobId);
            if (candidate == null || job == null)
                return NotFound(new { message = "Candidate or Job not found." });

            double score;
            try { score = await _aiMatchingService.CalculateMatchScoreAsync(candidate.Skills ?? "", job.RequiredSkills ?? ""); }
            catch { score = _aiMatchingService.CalculateMatchScore(candidate.Skills ?? "", job.RequiredSkills ?? ""); }

            return Ok(new
            {
                candidateId,
                jobId,
                matchScore = Math.Round(score, 1),
                matchPercentage = $"{Math.Round(score, 1)}%"
            });
        }

        // GET: api/AI/candidates/ranked/application/{applicationId}
        [HttpGet("candidates/ranked/application/{applicationId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetRankedCandidatesForApplication(int applicationId)
        {
            var application = await _context.Applications.FindAsync(applicationId);
            if (application == null)
                return NotFound(new { message = "Application not found." });

            var job = await _context.Jobs.FindAsync(application.JobId);
            if (job == null)
                return NotFound(new { message = "Related job not found." });

            List<RankedCandidate> ranked;
            try { ranked = await _aiMatchingService.RankCandidatesForJobAsync(job.Id); }
            catch { ranked = _aiMatchingService.RankCandidatesForJobSync(job.Id); }

            return Ok(new
            {
                jobTitle = job.Title,
                totalCandidates = ranked.Count,
                rankedCandidates = ranked
            });
        }

        // GET: api/AI/feedback/{applicationId}
        [HttpGet("feedback/{applicationId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetFeedback(int applicationId)
        {
            var application = await _context.Applications
                .Include(a => a.Candidate)
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null || application.Candidate == null || application.Job == null)
                return NotFound(new { message = "Application, candidate, or job not found." });

            double score;
            try { score = await _aiMatchingService.CalculateMatchScoreAsync(application.Candidate.Skills ?? "", application.Job.RequiredSkills ?? ""); }
            catch { score = _aiMatchingService.CalculateMatchScore(application.Candidate.Skills ?? "", application.Job.RequiredSkills ?? ""); }

            var feedback = await _geminiService.GenerateFeedbackAsync(application.Candidate.FullName, application.Job.Title, score);

            return Ok(new
            {
                applicationId,
                candidateName = application.Candidate.FullName,
                jobTitle = application.Job.Title,
                matchScore = Math.Round(score, 1),
                matchPercentage = $"{Math.Round(score, 1)}%",
                feedback,
                generatedAt = DateTime.UtcNow
            });
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