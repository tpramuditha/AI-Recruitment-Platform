using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Models;
using System.Security.Claims;

namespace RecruitmentPlatform.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CandidatesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CandidatesController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/candidates
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Candidate>>> GetCandidates()
        {
            return await _context.Candidates.ToListAsync();
        }

        // GET: api/candidates/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Candidate>> GetCandidate(int id)
        {
            var candidate = await _context.Candidates.FindAsync(id);

            if (candidate == null)
            {
                return NotFound();
            }

            return candidate;
        }

        // POST: api/candidates
        [HttpPost]
        public async Task<ActionResult<Candidate>> CreateCandidate(Candidate candidate)
        {
            _context.Candidates.Add(candidate);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCandidate), new { id = candidate.Id }, candidate);
        }

        // PUT: api/candidates/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCandidate(int id, Candidate candidate)
        {
            if (id != candidate.Id)
            {
                return BadRequest();
            }

            _context.Entry(candidate).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/candidates/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCandidate(int id)
        {
            var candidate = await _context.Candidates.FindAsync(id);
            if (candidate == null)
            {
                return NotFound();
            }

            _context.Candidates.Remove(candidate);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // =====================  Upload Resume =====================
        [HttpPost("upload-resume")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> UploadResume(IFormFile file)
        {
            // 1. Validate file
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            // 2. Check file extension
            var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Only .pdf, .doc, .docx files are allowed." });

            // 3. Check file size (5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File size exceeds 5MB limit." });

            // 4. Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "User not authenticated." });

            var userId = Guid.Parse(userIdClaim.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // 5. Find candidate by email
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email == user.Email);
            if (candidate == null)
                return BadRequest(new { message = "You don't have a candidate profile. Please complete your profile first." });

            // 6. Ensure upload directory exists
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "resumes");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // 7. Generate unique filename: {candidateId}_{timestamp}{extension}
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var fileName = $"{candidate.Id}_{timestamp}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // 8. Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 9. Update candidate's ResumeFilePath in DB (relative path for serving)
            var relativePath = Path.Combine("uploads", "resumes", fileName).Replace("\\", "/");
            candidate.ResumeFilePath = relativePath;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Resume uploaded successfully.",
                candidateId = candidate.Id,
                fileName = file.FileName,
                filePath = relativePath,
                uploadedAt = DateTime.UtcNow
            });
        }

        // =====================  Get My Profile =====================

        // GET: api/Candidates/my-profile
        [HttpGet("my-profile")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "User not authenticated." });

            var userId = Guid.Parse(userIdClaim.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email == user.Email);
            if (candidate == null)
                return BadRequest(new { message = "Candidate profile not found." });

            return Ok(new
            {
                candidate.Id,
                candidate.FullName,
                candidate.Email,
                candidate.PhoneNumber,
                candidate.Skills,
                candidate.ResumeFilePath,
                HasResume = !string.IsNullOrEmpty(candidate.ResumeFilePath),
                candidate.CreatedAt
            });
        }

        // PUT: api/Candidates/my-profile
        [HttpPut("my-profile")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
        {
            // 1. Get logged-in user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { message = "User not authenticated." });

            var userId = Guid.Parse(userIdClaim.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // 2. Find candidate by email
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Email == user.Email);
            if (candidate == null)
                return BadRequest(new { message = "Candidate profile not found." });

            // 3. Update allowed fields
            if (!string.IsNullOrWhiteSpace(request.FullName))
                candidate.FullName = request.FullName;

            // PhoneNumber can be null
            candidate.PhoneNumber = request.PhoneNumber;

            if (!string.IsNullOrWhiteSpace(request.Skills))
                candidate.Skills = request.Skills;

            await _context.SaveChangesAsync();

            // 4. Return updated profile (flattened)
            return Ok(new
            {
                candidate.Id,
                candidate.FullName,
                candidate.Email,
                candidate.PhoneNumber,
                candidate.Skills,
                candidate.ResumeFilePath,
                HasResume = !string.IsNullOrEmpty(candidate.ResumeFilePath),
                candidate.CreatedAt
            });
        }


        // Request DTO for update
        public class UpdateProfileRequest
        {
            public string? FullName { get; set; }
            public string? PhoneNumber { get; set; }
            public string? Skills { get; set; }
        }
    }
}