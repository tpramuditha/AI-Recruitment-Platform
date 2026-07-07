using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Models;
using RecruitmentPlatform.API.Services;
using System.Security.Claims;
using RecruitmentPlatform.API.Services;

namespace RecruitmentPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApplicationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<ApplicationsController> _logger;

        public ApplicationsController(ApplicationDbContext context, IEmailService emailService, ILogger<ApplicationsController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        // POST: api/applications (Candidate applies to a job)
        [HttpPost]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> ApplyToJob([FromBody] ApplyRequest request)
        {
            // Step 1: Get the logged-in user's ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "User not authenticated." });

            var userId = Guid.Parse(userIdClaim.Value);

            // Step 2: Find the User in the database to get their email
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Step 3: Find the Candidate record linked to this User
            // NOTE: If User and Candidate are not linked yet, we need to find by email.
            // Since you said they're kept separate, we'll find by Email.
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email == user.Email);

            if (candidate == null)
                return BadRequest(new { message = "You don't have a candidate profile. Please complete your profile first." });

            // Step 4: Check if the job exists
            var job = await _context.Jobs.FindAsync(request.JobId);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            if (!job.IsActive)
                return BadRequest(new { message = "This job is no longer active." });

            // Step 5: Check if already applied
            var existingApplication = await _context.Applications
                .FirstOrDefaultAsync(a => a.JobId == request.JobId && a.CandidateId == candidate.Id);

            if (existingApplication != null)
                return BadRequest(new { message = "You have already applied to this job." });

            // Step 6: Create the application
            var application = new Application
            {
                JobId = request.JobId,
                CandidateId = candidate.Id,
                AppliedAt = DateTime.UtcNow,
                Status = "Submitted"
            };

            _context.Applications.Add(application);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyApplications), new { id = application.Id }, application);
        }

        // GET: api/applications/my (Get all applications for the logged-in candidate)
        [HttpGet("my")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> GetMyApplications()
        {
            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Find candidate by email
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email == user.Email);

            if (candidate == null)
                return Ok(new List<Application>()); // No applications if no candidate profile

            var applications = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j!.PostedByUser)
                .Where(a => a.CandidateId == candidate.Id)
                .Select(a => new
                {
                    a.Id,
                    a.JobId,
                    a.Status,
                    a.AppliedAt,
                    JobTitle = a.Job != null ? a.Job.Title : "Unknown",
                    JobDepartment = a.Job != null ? a.Job.Department : "Unknown",
                    RecruiterName = a.Job != null && a.Job.PostedByUser != null ? a.Job.PostedByUser.FullName : "Unknown"
                })
                .OrderByDescending(a => a.AppliedAt)
                .ToListAsync();

            return Ok(applications);
        }

        // GET: api/applications/job/{jobId} (Get all applications for a specific job - Recruiter/Admin only)
        [HttpGet("job/{jobId}")]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> GetApplicationsForJob(int jobId)
        {
            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if job exists
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            // If user is not Admin, they can only view applications for jobs they posted
            if (userRole != "Admin" && job.PostedByUserId != userId)
                return Forbid("You can only view applications for jobs you posted.");

            var applications = await _context.Applications
                .Include(a => a.Candidate)
                .Include(a => a.Job)
                .Where(a => a.JobId == jobId)
                .Select(a => new
                {
                    a.Id,
                    a.Status,
                    a.AppliedAt,
                    CandidateName = a.Candidate != null ? a.Candidate.FullName : "Unknown",
                    CandidateEmail = a.Candidate != null ? a.Candidate.Email : "Unknown",
                    CandidateSkills = a.Candidate != null ? a.Candidate.Skills : "Unknown"
                })
                .OrderByDescending(a => a.AppliedAt)
                .ToListAsync();

            return Ok(applications);
        }

        // PUT: api/applications/{id}/status (Update application status - Recruiter/HiringManager/Admin)
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var application = await _context.Applications
                .Include(a => a.Candidate)
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null)
                return NotFound(new { message = "Application not found." });

            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // If user is not Admin, they can only update applications for jobs they posted
            if (userRole != "Admin" && application.Job != null && application.Job.PostedByUserId != userId)
                return Forbid("You can only update applications for jobs you posted.");

            // Validate status
            var validStatuses = new[] { "Submitted", "UnderReview", "Shortlisted", "Rejected", "Hired" };
            if (!validStatuses.Contains(request.Status))
                return BadRequest(new { message = $"Invalid status. Allowed values: {string.Join(", ", validStatuses)}" });

            application.Status = request.Status;
            await _context.SaveChangesAsync();

            // ---------- EMAIL NOTIFICATION ----------
            bool emailSent = false;
            try
            {
                // Get candidate email & name
                var candidateEmail = application.Candidate?.Email;
                var candidateName = application.Candidate?.FullName ?? "Candidate";
                var jobTitle = application.Job?.Title ?? "your application";

                // Get recruiter's name from claims (fallback if not present)
                var recruiterName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Recruitment Team";

                if (!string.IsNullOrEmpty(candidateEmail))
                {
                    await _emailService.SendApplicationStatusEmailAsync(
                        candidateEmail,
                        candidateName,
                        jobTitle,
                        request.Status,
                        recruiterName);
                    emailSent = true;
                }
                else
                {
                    _logger.LogWarning($"Candidate email is missing for application {id}. Email not sent.");
                }
            }
            catch (Exception ex)
            {
                // Log error but do not rethrow – we still want a 200 OK
                _logger.LogError(ex, $"Failed to send email for application {id} status update.");
                Console.WriteLine($"Email error: {ex.Message}");
            }

            return Ok(new { message = $"Application status updated to '{request.Status}'.",
                applicationId = application.Id,
                newStatus = application.Status,
                emailSent = emailSent
            });
        }
    }

    // Request DTOs
    public class ApplyRequest
    {
        public int JobId { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}