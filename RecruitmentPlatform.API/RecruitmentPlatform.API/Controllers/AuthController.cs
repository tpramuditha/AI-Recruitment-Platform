using Microsoft.AspNetCore.Mvc;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Models;
using RecruitmentPlatform.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace RecruitmentPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PasswordHasher _passwordHasher;
        private readonly JwtTokenGenerator _jwtTokenGenerator;

        public AuthController(ApplicationDbContext context, PasswordHasher passwordHasher, JwtTokenGenerator jwtTokenGenerator)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already registered." });

            // Create new user
            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = request.Role ?? "Candidate" // default to Candidate if not provided
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully", userId = user.Id });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            // Verify password
            if (!_passwordHasher.VerifyPassword(user.PasswordHash, request.Password))
                return Unauthorized(new { message = "Invalid email or password." });

            // Generate JWT token
            var token = _jwtTokenGenerator.GenerateToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role
                }
            });
        }
    }

    // Request DTOs (you can place them in the same file or separate DTOs folder)
    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Role { get; set; } // optional, defaults to Candidate
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}