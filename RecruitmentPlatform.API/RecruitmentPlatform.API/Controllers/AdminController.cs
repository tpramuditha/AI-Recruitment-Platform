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
    [Authorize(Roles = "Admin")] // All endpoints require Admin role
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ===================== USER MANAGEMENT =====================

        // GET: api/admin/users - List all users (with optional role filter)
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? role = null)
        {
            var query = _context.Users.AsQueryable();

            // Apply role filter if provided
            if (!string.IsNullOrEmpty(role))
            {
                var validRoles = new[] { "Candidate", "Recruiter", "HiringManager", "Admin" };
                if (!validRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = $"Invalid role. Allowed values: {string.Join(", ", validRoles)}" });
                }
                query = query.Where(u => u.Role == role);
            }

            var users = await query
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.CreatedAt
                })
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();

            return Ok(new
            {
                total = users.Count,
                users = users
            });
        }

        // PUT: api/admin/users/{id}/role - Change a user's role
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> ChangeUserRole(Guid id, [FromBody] ChangeRoleRequest request)
        {
            // Validate the new role
            var validRoles = new[] { "Candidate", "Recruiter", "HiringManager", "Admin" };
            if (!validRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = $"Invalid role. Allowed values: {string.Join(", ", validRoles)}" });
            }

            // Find the user
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Check if user is trying to change their own role
            var currentAdminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (currentAdminIdClaim != null)
            {
                var currentAdminId = Guid.Parse(currentAdminIdClaim.Value);
                if (currentAdminId == id)
                {
                    return BadRequest(new { message = "You cannot change your own role." });
                }
            }

            // Update the role
            user.Role = request.Role;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"User role updated successfully to '{request.Role}'.",
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.CreatedAt
                }
            });
        }

        // DELETE: api/admin/users/{id} - Delete a user
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            // Find the user
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Check if trying to delete yourself
            var currentAdminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (currentAdminIdClaim != null)
            {
                var currentAdminId = Guid.Parse(currentAdminIdClaim.Value);
                if (currentAdminId == id)
                {
                    return BadRequest(new { message = "You cannot delete your own account." });
                }
            }

            // Check if user has related records (Jobs, Interviews, Evaluations)
            var hasJobs = await _context.Jobs.AnyAsync(j => j.PostedByUserId == id);
            var hasInterviews = await _context.Interviews.AnyAsync(i => i.InterviewerUserId == id);
            var hasEvaluations = await _context.Evaluations.AnyAsync(e => e.EvaluatedByUserId == id);

            if (hasJobs || hasInterviews || hasEvaluations)
            {

                // Soft delete: deactivate instead of hard delete
                user.IsActive = false; 
                await _context.SaveChangesAsync();
                return Ok(new
                {
                    message = "User has related records. User has been deactivated instead of deleted.",
                    userId = user.Id,
                    status = "Deactivated"
                });
            }

            // If no related records, hard delete
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"User '{user.FullName}' deleted successfully.",
                userId = user.Id
            });
        }

        // ===================== DASHBOARD ANALYTICS =====================

        // GET: api/admin/dashboard - Analytics summary
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            // Get current counts using aggregation queries (efficient, DB-side)
            var totalCandidates = await _context.Users.CountAsync(u => u.Role == "Candidate");
            var totalRecruiters = await _context.Users.CountAsync(u => u.Role == "Recruiter");
            var totalHiringManagers = await _context.Users.CountAsync(u => u.Role == "HiringManager");
            var totalAdmins = await _context.Users.CountAsync(u => u.Role == "Admin");

            // Job counts
            var totalJobs = await _context.Jobs.CountAsync();
            var activeJobs = await _context.Jobs.CountAsync(j => j.IsActive);
            var inactiveJobs = totalJobs - activeJobs;

            // Applications grouped by status
            var applicationsByStatus = await _context.Applications
                .GroupBy(a => a.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToDictionaryAsync(g => g.Status, g => g.Count);

            // Interviews grouped by status
            var interviewsByStatus = await _context.Interviews
                .GroupBy(i => i.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToDictionaryAsync(g => g.Status, g => g.Count);

            // Recent activity stats (last 7 days)
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var newApplications = await _context.Applications
                .CountAsync(a => a.AppliedAt >= sevenDaysAgo);
            var newUsers = await _context.Users
                .CountAsync(u => u.CreatedAt >= sevenDaysAgo);
            var newJobs = await _context.Jobs
                .CountAsync(j => j.PostedAt >= sevenDaysAgo);

            return Ok(new
            {
                users = new
                {
                    total = totalCandidates + totalRecruiters + totalHiringManagers + totalAdmins,
                    byRole = new
                    {
                        Candidate = totalCandidates,
                        Recruiter = totalRecruiters,
                        HiringManager = totalHiringManagers,
                        Admin = totalAdmins
                    }
                },
                jobs = new
                {
                    total = totalJobs,
                    active = activeJobs,
                    inactive = inactiveJobs
                },
                applications = new
                {
                    total = applicationsByStatus.Values.Sum(),
                    byStatus = new
                    {
                        Submitted = applicationsByStatus.GetValueOrDefault("Submitted", 0),
                        UnderReview = applicationsByStatus.GetValueOrDefault("UnderReview", 0),
                        Shortlisted = applicationsByStatus.GetValueOrDefault("Shortlisted", 0),
                        Rejected = applicationsByStatus.GetValueOrDefault("Rejected", 0),
                        Hired = applicationsByStatus.GetValueOrDefault("Hired", 0)
                    }
                },
                interviews = new
                {
                    total = interviewsByStatus.Values.Sum(),
                    byStatus = new
                    {
                        Scheduled = interviewsByStatus.GetValueOrDefault("Scheduled", 0),
                        Completed = interviewsByStatus.GetValueOrDefault("Completed", 0),
                        Cancelled = interviewsByStatus.GetValueOrDefault("Cancelled", 0)
                    }
                },
                recentActivity = new
                {
                    newApplications,
                    newUsers,
                    newJobs,
                    last7Days = sevenDaysAgo
                }
            });
        }

        // ===================== RECENT APPLICATIONS =====================

        // GET: api/admin/applications/recent - Last 10 applications
        [HttpGet("applications/recent")]
        public async Task<IActionResult> GetRecentApplications([FromQuery] int limit = 10)
        {
            if (limit < 1 || limit > 50)
            {
                return BadRequest(new { message = "Limit must be between 1 and 50." });
            }

            var recentApplications = await _context.Applications
                .Include(a => a.Candidate)
                .Include(a => a.Job)
                .OrderByDescending(a => a.AppliedAt)
                .Take(limit)
                .Select(a => new
                {
                    a.Id,
                    a.JobId,
                    a.Status,
                    a.AppliedAt,
                    CandidateName = a.Candidate != null ? a.Candidate.FullName : "Unknown",
                    CandidateEmail = a.Candidate != null ? a.Candidate.Email : "Unknown",
                    JobTitle = a.Job != null ? a.Job.Title : "Unknown",
                    JobDepartment = a.Job != null ? a.Job.Department : "Unknown",
                    HasInterview = a.Interviews.Any(),
                    HasEvaluation = a.Evaluations.Any()
                })
                .ToListAsync();

            return Ok(new
            {
                total = recentApplications.Count,
                applications = recentApplications
            });
        }
    }

    // ===================== REQUEST DTOs =====================

    public class ChangeRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}