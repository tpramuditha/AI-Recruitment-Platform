using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Models;
using System.Security.Claims;

namespace RecruitmentPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvaluationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EvaluationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/evaluations (Submit an evaluation)
        [HttpPost]
        [Authorize(Roles = "HiringManager,Admin")]
        public async Task<IActionResult> SubmitEvaluation([FromBody] SubmitEvaluationRequest request)
        {
            // Check if application exists
            var application = await _context.Applications
                .Include(a => a.Job)
                .Include(a => a.Candidate)
                .FirstOrDefaultAsync(a => a.Id == request.ApplicationId);

            if (application == null)
                return NotFound(new { message = "Application not found." });

            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if user has already evaluated this application
            var existingEvaluation = await _context.Evaluations
                .FirstOrDefaultAsync(e => e.ApplicationId == request.ApplicationId && e.EvaluatedByUserId == userId);

            if (existingEvaluation != null)
                return BadRequest(new { message = "You have already evaluated this application." });

            // Validate scores
            if (request.TechnicalScore < 1 || request.TechnicalScore > 5 ||
                request.CommunicationScore < 1 || request.CommunicationScore > 5 ||
                request.CultureFitScore < 1 || request.CultureFitScore > 5)
                return BadRequest(new { message = "Scores must be between 1 and 5." });

            // Validate recommendation
            var validRecommendations = new[] { "Hire", "NoHire", "NextRound" };
            if (!validRecommendations.Contains(request.Recommendation))
                return BadRequest(new { message = $"Invalid recommendation. Allowed values: {string.Join(", ", validRecommendations)}" });

            var evaluation = new Evaluation
            {
                ApplicationId = request.ApplicationId,
                EvaluatedByUserId = userId,
                TechnicalScore = request.TechnicalScore,
                CommunicationScore = request.CommunicationScore,
                CultureFitScore = request.CultureFitScore,
                Feedback = request.Feedback,
                Recommendation = request.Recommendation,
                EvaluatedAt = DateTime.UtcNow
            };

            _context.Evaluations.Add(evaluation);
            await _context.SaveChangesAsync();

            // Update application status if recommended
            if (request.Recommendation == "Hire")
            {
                application.Status = "Hired";
            }
            else if (request.Recommendation == "NoHire")
            {
                application.Status = "Rejected";
            }
            else if (request.Recommendation == "NextRound")
            {
                application.Status = "UnderReview";
            }
            await _context.SaveChangesAsync();

            // Return flattened response
            var evaluator = await _context.Users.FindAsync(userId);

            return CreatedAtAction(nameof(GetEvaluationsByApplication), new { applicationId = evaluation.ApplicationId }, new
            {
                evaluation.Id,
                evaluation.ApplicationId,
                evaluation.TechnicalScore,
                evaluation.CommunicationScore,
                evaluation.CultureFitScore,
                evaluation.Feedback,
                evaluation.Recommendation,
                evaluation.EvaluatedAt,
                EvaluatorName = evaluator != null ? evaluator.FullName : "Unknown",
                EvaluatorEmail = evaluator != null ? evaluator.Email : "Unknown",
                CandidateName = application.Candidate?.FullName ?? "Unknown",
                JobTitle = application.Job?.Title ?? "Unknown",
                ApplicationStatus = application.Status
            });
        }

        // GET: api/evaluations/application/{applicationId} (View evaluations for an application)
        [HttpGet("application/{applicationId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetEvaluationsByApplication(int applicationId)
        {
            // Check if application exists
            var application = await _context.Applications
                .Include(a => a.Job)
                .Include(a => a.Candidate)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                return NotFound(new { message = "Application not found." });

            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // If not Admin, check permissions
            if (userRole != "Admin")
            {
                var isRecruiter = userRole == "Recruiter" && application.Job != null && application.Job.PostedByUserId == userId;
                var isHiringManager = userRole == "HiringManager";

                if (!isRecruiter && !isHiringManager)
                    return Forbid("You don't have permission to view evaluations for this application.");
            }

            var evaluations = await _context.Evaluations
                .Include(e => e.EvaluatedByUser)
                .Include(e => e.Application)
                    .ThenInclude(a => a!.Candidate)
                .Include(e => e.Application)
                    .ThenInclude(a => a!.Job)
                .Where(e => e.ApplicationId == applicationId)
                .Select(e => new
                {
                    e.Id,
                    e.ApplicationId,
                    e.TechnicalScore,
                    e.CommunicationScore,
                    e.CultureFitScore,
                    e.Feedback,
                    e.Recommendation,
                    e.EvaluatedAt,
                    EvaluatorName = e.EvaluatedByUser != null ? e.EvaluatedByUser.FullName : "Unknown",
                    EvaluatorEmail = e.EvaluatedByUser != null ? e.EvaluatedByUser.Email : "Unknown",
                    CandidateName = e.Application != null && e.Application.Candidate != null ? e.Application.Candidate.FullName : "Unknown",
                    JobTitle = e.Application != null && e.Application.Job != null ? e.Application.Job.Title : "Unknown",
                    ApplicationStatus = e.Application != null ? e.Application.Status : "Unknown"
                })
                .OrderByDescending(e => e.EvaluatedAt)
                .ToListAsync();

            return Ok(evaluations);
        }

        // GET: api/evaluations/my (Get my evaluations - Hiring Manager view)
        [HttpGet("my")]
        [Authorize(Roles = "HiringManager,Admin")]
        public async Task<IActionResult> GetMyEvaluations()
        {
            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);

            var evaluations = await _context.Evaluations
                .Include(e => e.Application)
                    .ThenInclude(a => a!.Candidate)
                .Include(e => e.Application)
                    .ThenInclude(a => a!.Job)
                .Where(e => e.EvaluatedByUserId == userId)
                .Select(e => new
                {
                    e.Id,
                    e.ApplicationId,
                    e.TechnicalScore,
                    e.CommunicationScore,
                    e.CultureFitScore,
                    e.Feedback,
                    e.Recommendation,
                    e.EvaluatedAt,
                    CandidateName = e.Application != null && e.Application.Candidate != null ? e.Application.Candidate.FullName : "Unknown",
                    JobTitle = e.Application != null && e.Application.Job != null ? e.Application.Job.Title : "Unknown",
                    ApplicationStatus = e.Application != null ? e.Application.Status : "Unknown"
                })
                .OrderByDescending(e => e.EvaluatedAt)
                .ToListAsync();

            return Ok(evaluations);
        }
    }

    // Request DTOs
    public class SubmitEvaluationRequest
    {
        public int ApplicationId { get; set; }
        public int TechnicalScore { get; set; }
        public int CommunicationScore { get; set; }
        public int CultureFitScore { get; set; }
        public string? Feedback { get; set; }
        public string Recommendation { get; set; } = "NextRound";
    }
}