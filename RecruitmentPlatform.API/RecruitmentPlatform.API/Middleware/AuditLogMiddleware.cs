using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Models;

namespace RecruitmentPlatform.API.Middleware
{
    public class AuditLogMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditLogMiddleware> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public AuditLogMiddleware(RequestDelegate next, ILogger<AuditLogMiddleware> logger, IServiceScopeFactory scopeFactory)
        {
            _next = next;
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only log API requests (paths starting with /api/)
            var path = context.Request.Path.Value ?? string.Empty;
            if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Skip logging GET requests (only log POST, PUT, DELETE)
            var method = context.Request.Method.ToUpperInvariant();
            if (method == "GET")
            {
                await _next(context);
                return;
            }

            // Capture request info
            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
            var userEmail = context.User?.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
            var userRole = context.User?.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;

            // Read request body if needed (for Details) – but careful not to break streaming
            string? requestBody = null;
            if (context.Request.ContentLength > 0 && context.Request.ContentLength < 1024 * 10) // only small bodies
            {
                context.Request.EnableBuffering();
                using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0; // reset for next middleware
            }

            await _next(context);

            // Log asynchronously after response is sent
            var statusCode = context.Response.StatusCode;
            var endpoint = context.Request.Path;
            var action = method;

            // Build details string
            var details = new StringBuilder();
            if (!string.IsNullOrEmpty(requestBody))
            {
                details.Append($"Body: {requestBody} ");
            }
            if (context.Response.Headers.ContainsKey("X-Error"))
            {
                details.Append($"Error: {context.Response.Headers["X-Error"]} ");
            }

            // Fire-and-forget logging (non-blocking)
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    var log = new AuditLog
                    {
                        UserId = userId,
                        UserEmail = userEmail,
                        UserRole = userRole,
                        Action = action,
                        Endpoint = endpoint,
                        StatusCode = statusCode,
                        IpAddress = ipAddress,
                        Timestamp = DateTime.UtcNow,
                        Details = details.Length > 0 ? details.ToString() : null
                    };

                    await dbContext.AuditLogs.AddAsync(log);
                    await dbContext.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    // Log error to console but don't crash the request
                    _logger.LogError(ex, "Failed to save audit log");
                }
            });
        }
    }

    // Extension method for easy registration
    public static class AuditLogMiddlewareExtensions
    {
        public static IApplicationBuilder UseAuditLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuditLogMiddleware>();
        }
    }
}