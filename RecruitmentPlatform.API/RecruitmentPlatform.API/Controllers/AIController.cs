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
    [Authorize] // All AI endpoints require authentication
    public class AIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AIMatchingService _matchingService;

        public AIController(ApplicationDbContext context, AIMatchingService matchingService)
        {
            _context = context;
            _matchingService = matchingService;
        }

        // GET: api/ai/jobs/recommended - Get job recommendations for logged-in candidate
        [HttpGet("jobs/recommended")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> GetRecommendedJobs()
        {
            // Get logged-in user's ID from JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "User not authenticated." });

            var userId = Guid.Parse(userIdClaim.Value);

            // Get the user to find their email
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Get the candidate profile (matched by email)
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email == user.Email);

            if (candidate == null)
                return NotFound(new { message = "Candidate profile not found. Please complete your profile." });

            // Get all active jobs
            var jobs = await _context.Jobs
                .Where(j => j.IsActive)
                .ToListAsync();

            if (!jobs.Any())
                return Ok(new { message = "No active jobs available.", recommendations = new List<JobMatchResult>() });

            // Rank jobs for the candidate
            var recommendations = _matchingService.RankJobsForCandidate(candidate, jobs);

            return Ok(new
            {
                candidateId = candidate.Id,
                candidateName = candidate.FullName,
                totalJobsConsidered = jobs.Count,
                recommendations = recommendations,
                topMatch = recommendations.FirstOrDefault()
            });
        }

        // GET: api/ai/candidates/ranked/{jobId} - Rank candidates who applied to a job
        [HttpGet("candidates/ranked/{jobId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetRankedCandidatesForJob(int jobId)
        {
            // Get the job
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            // Get all applications for this job
            var applications = await _context.Applications
                .Include(a => a.Candidate)
                .Where(a => a.JobId == jobId)
                .ToListAsync();

            if (!applications.Any())
                return Ok(new { message = "No applicants for this job.", candidates = new List<CandidateRankResult>() });

            // Get candidates from applications
            var candidates = applications
                .Where(a => a.Candidate != null)
                .Select(a => a.Candidate!)
                .ToList();

            // Rank candidates
            var rankedCandidates = _matchingService.RankCandidatesForJob(job, candidates);

            return Ok(new
            {
                jobId = job.Id,
                jobTitle = job.Title,
                totalApplicants = candidates.Count,
                matchedCandidates = rankedCandidates.Count,
                candidates = rankedCandidates
            });
        }

        // GET: api/ai/match-score?candidateId={candidateId}&jobId={jobId}
        [HttpGet("match-score")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetMatchScore([FromQuery] int candidateId, [FromQuery] int jobId)
        {
            // Get candidate
            var candidate = await _context.Candidates.FindAsync(candidateId);
            if (candidate == null)
                return NotFound(new { message = "Candidate not found." });

            // Get job
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            // Calculate match score
            var score = _matchingService.GetMatchScore(candidate, job);

            return Ok(new MatchScoreResult
            {
                CandidateId = candidate.Id,
                CandidateName = candidate.FullName,
                JobId = job.Id,
                JobTitle = job.Title,
                MatchScore = score,
                MatchPercentage = $"{score}%"
            });
        }

        // GET: api/ai/candidates/ranked/application/{applicationId} 
        // Rank candidates for a specific application (alternative method)
        [HttpGet("candidates/ranked/application/{applicationId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetRankedCandidatesForApplication(int applicationId)
        {
            // Get the application
            var application = await _context.Applications
                .Include(a => a.Job)
                .Include(a => a.Candidate)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                return NotFound(new { message = "Application not found." });

            // Get all applications for the same job
            var allApplications = await _context.Applications
                .Include(a => a.Candidate)
                .Where(a => a.JobId == application.JobId)
                .ToListAsync();

            if (!allApplications.Any())
                return Ok(new { message = "No other applicants for this job.", candidates = new List<CandidateRankResult>() });

            // Get all candidates for this job
            var candidates = allApplications
                .Where(a => a.Candidate != null)
                .Select(a => a.Candidate!)
                .ToList();

            // Rank candidates
            var rankedCandidates = _matchingService.RankCandidatesForJob(application.Job!, candidates);

            // Find the rank of the specific candidate
            var candidateRank = rankedCandidates
                .Select((c, index) => new { c.CandidateId, Rank = index + 1 })
                .FirstOrDefault(c => c.CandidateId == application.CandidateId);

            return Ok(new
            {
                jobId = application.JobId,
                jobTitle = application.Job?.Title ?? "Unknown",
                totalApplicants = candidates.Count,
                matchedCandidates = rankedCandidates.Count,
                currentCandidateRank = candidateRank?.Rank ?? -1,
                candidates = rankedCandidates
            });
        }
    }
}