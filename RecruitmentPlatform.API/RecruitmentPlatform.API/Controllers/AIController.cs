using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Services;
using System.Security.Claims;

namespace RecruitmentPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AIMatchingService _aiService;
        private readonly GeminiService _geminiService;

        public AIController(ApplicationDbContext context, AIMatchingService aiService, GeminiService geminiService)
        {
            _context = context;
            _aiService = aiService;
            _geminiService = geminiService;
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
                return Ok(new { message = "No candidate profile found.", recommendations = new List<object>() });

            try
            {
                // Try async AI version
                var recommendations = await _aiService.RankJobsForCandidateAsync(candidate.Id);
                return Ok(new
                {
                    candidateId = candidate.Id,
                    totalJobs = recommendations.Count,
                    recommendations = recommendations
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI matching error: {ex.Message}");
                // Fallback to sync version
                var recommendations = _aiService.RankJobsForCandidateSync(candidate.Id);
                return Ok(new
                {
                    candidateId = candidate.Id,
                    totalJobs = recommendations.Count,
                    recommendations = recommendations,
                    note = "Using fallback matching (AI service unavailable)"
                });
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

            try
            {
                var rankedCandidates = await _aiService.RankCandidatesForJobAsync(jobId);
                return Ok(new
                {
                    jobId = jobId,
                    jobTitle = job.Title,
                    totalCandidates = rankedCandidates.Count,
                    rankedCandidates = rankedCandidates
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI matching error: {ex.Message}");
                var rankedCandidates = _aiService.RankCandidatesForJobSync(jobId);
                return Ok(new
                {
                    jobId = jobId,
                    jobTitle = job.Title,
                    totalCandidates = rankedCandidates.Count,
                    rankedCandidates = rankedCandidates,
                    note = "Using fallback matching (AI service unavailable)"
                });
            }
        }

        // GET: api/AI/match-score
        [HttpGet("match-score")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetMatchScore([FromQuery] int candidateId, [FromQuery] int jobId)
        {
            var candidate = await _context.Candidates.FindAsync(candidateId);
            if (candidate == null)
                return NotFound(new { message = "Candidate not found." });

            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            try
            {
                var score = await _aiService.CalculateMatchScoreAsync(
                    candidate.Skills ?? "",
                    job.RequiredSkills ?? ""
                );

                return Ok(new
                {
                    candidateId = candidateId,
                    candidateName = candidate.FullName,
                    jobId = jobId,
                    jobTitle = job.Title,
                    matchScore = score,
                    matchPercentage = $"{score:F0}%"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI matching error: {ex.Message}");
                var score = _aiService.CalculateMatchScore(
                    candidate.Skills ?? "",
                    job.RequiredSkills ?? ""
                );
                return Ok(new
                {
                    candidateId = candidateId,
                    candidateName = candidate.FullName,
                    jobId = jobId,
                    jobTitle = job.Title,
                    matchScore = score,
                    matchPercentage = $"{score:F0}%",
                    note = "Using fallback matching (AI service unavailable)"
                });
            }
        }

        // GET: api/AI/candidates/ranked/application/{applicationId}
        [HttpGet("candidates/ranked/application/{applicationId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetRankedCandidatesByApplication(int applicationId)
        {
            var application = await _context.Applications
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                return NotFound(new { message = "Application not found." });

            if (application.Job == null)
                return NotFound(new { message = "Job not found for this application." });

            try
            {
                var rankedCandidates = await _aiService.RankCandidatesForJobAsync(application.JobId);
                return Ok(new
                {
                    applicationId = applicationId,
                    jobId = application.JobId,
                    jobTitle = application.Job.Title,
                    totalCandidates = rankedCandidates.Count,
                    rankedCandidates = rankedCandidates
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI matching error: {ex.Message}");
                var rankedCandidates = _aiService.RankCandidatesForJobSync(application.JobId);
                return Ok(new
                {
                    applicationId = applicationId,
                    jobId = application.JobId,
                    jobTitle = application.Job.Title,
                    totalCandidates = rankedCandidates.Count,
                    rankedCandidates = rankedCandidates,
                    note = "Using fallback matching (AI service unavailable)"
                });
            }
        }

        // NEW: GET: api/AI/feedback/{applicationId}
        [HttpGet("feedback/{applicationId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetFeedback(int applicationId)
        {
            var application = await _context.Applications
                .Include(a => a.Candidate)
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                return NotFound(new { message = "Application not found." });

            if (application.Candidate == null || application.Job == null)
                return NotFound(new { message = "Candidate or Job not found for this application." });

            try
            {
                // Get match score first
                var matchScore = await _aiService.CalculateMatchScoreAsync(
                    application.Candidate.Skills ?? "",
                    application.Job.RequiredSkills ?? ""
                );

                var feedback = await _geminiService.GenerateFeedbackAsync(
                    application.Candidate.FullName,
                    application.Job.Title,
                    matchScore
                );

                return Ok(new
                {
                    applicationId = applicationId,
                    candidateName = application.Candidate.FullName,
                    jobTitle = application.Job.Title,
                    matchScore = matchScore,
                    matchPercentage = $"{matchScore:F0}%",
                    feedback = feedback,
                    generatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Feedback generation error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to generate feedback.", error = ex.Message });
            }
        }

        // NEW: POST: api/AI/extract-skills
        [HttpPost("extract-skills")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> ExtractSkills([FromBody] ExtractSkillsRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ProfileText))
                return BadRequest(new { message = "Profile text is required." });

            try
            {
                var skills = await _geminiService.ExtractSkillsAsync(request.ProfileText);

                // Update the candidate's skills if they want (optional)
                // But we'll let the frontend decide whether to apply

                return Ok(new
                {
                    extractedSkills = skills,
                    skillList = skills.Split(',')
                        .Select(s => s.Trim())
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Skill extraction error: {ex.Message}");
                return StatusCode(500, new { message = "Failed to extract skills.", error = ex.Message });
            }
        }
    }

    public class ExtractSkillsRequest
    {
        public string ProfileText { get; set; } = string.Empty;
    }
}