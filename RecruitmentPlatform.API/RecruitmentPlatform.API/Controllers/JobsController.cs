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
    public class JobsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public JobsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Jobs (Allow any authenticated user)
        [HttpGet]
        [Authorize] // Any authenticated user (Candidate, Recruiter, Admin, etc.)
        public async Task<IActionResult> GetJobs()
        {
            var jobs = await _context.Jobs
                .Include(j => j.PostedByUser)
                .Where(j => j.IsActive)
                .Select(j => new
                {
                    j.Id,
                    j.Title,
                    j.Description,
                    j.Department,
                    j.Location,
                    j.EmploymentType,
                    j.RequiredSkills,
                    j.PostedAt,
                    j.IsActive,
                    PostedBy = j.PostedByUser != null ? j.PostedByUser.FullName : "Unknown"
                })
                .OrderByDescending(j => j.PostedAt)
                .ToListAsync();

            return Ok(jobs);
        }

        // GET: api/Jobs/{id} (Allow any authenticated user)
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetJob(int id)
        {
            var job = await _context.Jobs
                .Include(j => j.PostedByUser)
                .Include(j => j.Applications)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == null)
                return NotFound(new { message = "Job not found." });

            return Ok(job);
        }

        // POST: api/Jobs (Only Recruiter or Admin)
        [HttpPost]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request)
        {
            // Get the current user's ID from the JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "User not authenticated." });

            var userId = Guid.Parse(userIdClaim.Value);

            var job = new Job
            {
                Title = request.Title,
                Description = request.Description,
                Department = request.Department,
                Location = request.Location,
                EmploymentType = request.EmploymentType ?? "FullTime",
                RequiredSkills = request.RequiredSkills ?? string.Empty,
                PostedByUserId = userId,
                PostedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJob), new { id = job.Id }, job);
        }

        // PUT: api/Jobs/{id} (Only Recruiter who posted it, or Admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] UpdateJobRequest request)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            // Get current user ID and role
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // If user is not Admin, they can only update their own jobs
            if (userRole != "Admin" && job.PostedByUserId != userId)
                return Forbid("You can only edit jobs you posted.");

            // Update fields (only update if provided)
            if (!string.IsNullOrEmpty(request.Title))
                job.Title = request.Title;

            if (!string.IsNullOrEmpty(request.Description))
                job.Description = request.Description;

            if (!string.IsNullOrEmpty(request.Department))
                job.Department = request.Department;

            if (!string.IsNullOrEmpty(request.Location))
                job.Location = request.Location;

            if (!string.IsNullOrEmpty(request.EmploymentType))
                job.EmploymentType = request.EmploymentType;

            if (!string.IsNullOrEmpty(request.RequiredSkills))
                job.RequiredSkills = request.RequiredSkills;

            if (request.IsActive.HasValue)
                job.IsActive = request.IsActive.Value;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Job updated successfully.", job });
        }

        // DELETE: api/Jobs/{id} (Only Admin or Recruiter who posted it)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                return NotFound(new { message = "Job not found." });

            // Get current user ID and role
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // If user is not Admin, they can only delete their own jobs
            if (userRole != "Admin" && job.PostedByUserId != userId)
                return Forbid("You can only delete jobs you posted.");

            // Soft delete (mark as inactive) or hard delete?
            // For coursework, hard delete is fine:
            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Job deleted successfully." });
        }
    }

    // Request DTOs
    public class CreateJobRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string? EmploymentType { get; set; }
        public string? RequiredSkills { get; set; }
    }

    public class UpdateJobRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Department { get; set; }
        public string? Location { get; set; }
        public string? EmploymentType { get; set; }
        public string? RequiredSkills { get; set; }
        public bool? IsActive { get; set; }
    }
}