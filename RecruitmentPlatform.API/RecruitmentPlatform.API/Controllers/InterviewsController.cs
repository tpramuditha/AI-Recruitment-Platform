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
    public class InterviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InterviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/interviews (Schedule an interview)
        [HttpPost]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> ScheduleInterview([FromBody] ScheduleInterviewRequest request)
        {
            // Check if application exists
            var application = await _context.Applications
                .Include(a => a.Job)
                .Include(a => a.Candidate)
                .FirstOrDefaultAsync(a => a.Id == request.ApplicationId);

            if (application == null)
                return NotFound(new { message = "Application not found." });

            // Check if interviewer exists
            var interviewer = await _context.Users.FindAsync(request.InterviewerUserId);
            if (interviewer == null)
                return NotFound(new { message = "Interviewer not found." });

            // Check if interviewer has correct role (HiringManager or Admin)
            if (interviewer.Role != "HiringManager" && interviewer.Role != "Admin")
                return BadRequest(new { message = "Interviewer must be a Hiring Manager or Admin." });

            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // If not Admin, ensure recruiter owns the job
            if (userRole != "Admin" && application.Job != null && application.Job.PostedByUserId != userId)
                return Forbid("You can only schedule interviews for jobs you posted.");

            var interview = new Interview
            {
                ApplicationId = request.ApplicationId,
                ScheduledAt = request.ScheduledAt,
                DurationMinutes = request.DurationMinutes ?? 60,
                InterviewerUserId = request.InterviewerUserId,
                Status = "Scheduled",
                Notes = request.Notes
            };

            _context.Interviews.Add(interview);
            await _context.SaveChangesAsync();

            // Return flattened response
            return CreatedAtAction(nameof(GetInterviewsByApplication), new { applicationId = interview.ApplicationId }, new
            {
                interview.Id,
                interview.ApplicationId,
                interview.ScheduledAt,
                interview.DurationMinutes,
                interview.Status,
                interview.Notes,
                InterviewerName = interviewer.FullName,
                InterviewerEmail = interviewer.Email,
                CandidateName = application.Candidate?.FullName ?? "Unknown",
                CandidateEmail = application.Candidate?.Email ?? "Unknown",
                JobTitle = application.Job?.Title ?? "Unknown"
            });
        }

        // GET: api/interviews/application/{applicationId} (View interviews for an application)
        [HttpGet("application/{applicationId}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> GetInterviewsByApplication(int applicationId)
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
                    return Forbid("You don't have permission to view interviews for this application.");
            }

            var interviews = await _context.Interviews
                .Include(i => i.InterviewerUser)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Candidate)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Job)
                .Where(i => i.ApplicationId == applicationId)
                .Select(i => new
                {
                    i.Id,
                    i.ApplicationId,
                    i.ScheduledAt,
                    i.DurationMinutes,
                    i.Status,
                    i.Notes,
                    InterviewerName = i.InterviewerUser != null ? i.InterviewerUser.FullName : "Unknown",
                    InterviewerEmail = i.InterviewerUser != null ? i.InterviewerUser.Email : "Unknown",
                    CandidateName = i.Application != null && i.Application.Candidate != null ? i.Application.Candidate.FullName : "Unknown",
                    CandidateEmail = i.Application != null && i.Application.Candidate != null ? i.Application.Candidate.Email : "Unknown",
                    JobTitle = i.Application != null && i.Application.Job != null ? i.Application.Job.Title : "Unknown"
                })
                .OrderBy(i => i.ScheduledAt)
                .ToListAsync();

            return Ok(interviews);
        }

        // PUT: api/interviews/{id} (Update interview status/notes)
        [HttpPut("{id}")]
        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        public async Task<IActionResult> UpdateInterview(int id, [FromBody] UpdateInterviewRequest request)
        {
            var interview = await _context.Interviews
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Job)
                .Include(i => i.InterviewerUser)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Candidate)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interview == null)
                return NotFound(new { message = "Interview not found." });

            // Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check permissions
            if (userRole != "Admin")
            {
                var isRecruiter = userRole == "Recruiter" && interview.Application != null && interview.Application.Job != null && interview.Application.Job.PostedByUserId == userId;
                var isHiringManager = userRole == "HiringManager" && interview.InterviewerUserId == userId;

                if (!isRecruiter && !isHiringManager)
                    return Forbid("You don't have permission to update this interview.");
            }

            // Update fields
            if (!string.IsNullOrEmpty(request.Status))
            {
                var validStatuses = new[] { "Scheduled", "Completed", "Cancelled" };
                if (!validStatuses.Contains(request.Status))
                    return BadRequest(new { message = $"Invalid status. Allowed values: {string.Join(", ", validStatuses)}" });
                interview.Status = request.Status;
            }

            if (request.Notes != null)
                interview.Notes = request.Notes;

            if (request.ScheduledAt.HasValue)
                interview.ScheduledAt = request.ScheduledAt.Value;

            await _context.SaveChangesAsync();

            // Return flattened response
            return Ok(new
            {
                interview.Id,
                interview.ApplicationId,
                interview.ScheduledAt,
                interview.DurationMinutes,
                interview.Status,
                interview.Notes,
                InterviewerName = interview.InterviewerUser != null ? interview.InterviewerUser.FullName : "Unknown",
                CandidateName = interview.Application != null && interview.Application.Candidate != null ? interview.Application.Candidate.FullName : "Unknown",
                JobTitle = interview.Application != null && interview.Application.Job != null ? interview.Application.Job.Title : "Unknown"
            });
        }
    }

    // Request DTOs
    public class ScheduleInterviewRequest
    {
        public int ApplicationId { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int? DurationMinutes { get; set; }
        public Guid InterviewerUserId { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateInterviewRequest
    {
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }
}