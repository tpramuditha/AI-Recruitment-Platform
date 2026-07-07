using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace RecruitmentPlatform.API.Services;  

public interface IEmailService
{
    Task SendApplicationStatusEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string newStatus,
        string recruiterName);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendApplicationStatusEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string newStatus,
        string recruiterName)
    {
        try
        {
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderName = _configuration["EmailSettings:SenderName"];
            var appPassword = _configuration["EmailSettings:AppPassword"];
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]);

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(appPassword))
            {
                _logger.LogError("Email settings are not properly configured.");
                return;
            }

            var subject = $"Application Status Update - {jobTitle}";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; color: #333;'>
                    <p>Dear {candidateName},</p>
                    <p>Your application for the position of <strong>{jobTitle}</strong> has been updated to <strong>{newStatus}</strong>.</p>
                    <p>We appreciate your interest in joining our team.</p>
                    <p>Best regards,<br/>
                    {recruiterName}<br/>
                    Recruitment Platform</p>
                </body>
                </html>";

            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, appPassword)
            };

            await client.SendMailAsync(message);
            _logger.LogInformation($"Status update email sent to {toEmail} for job {jobTitle}.");
        }
        catch (Exception ex)
        {
            // Log error but do not rethrow – email failure should not break the status update
            _logger.LogError(ex, $"Failed to send status update email to {toEmail}.");
            Console.WriteLine($"Email error: {ex.Message}");   // optional console log as requested
        }
    }
}