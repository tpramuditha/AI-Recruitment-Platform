using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Data;
using RecruitmentPlatform.API.Models;

namespace RecruitmentPlatform.API.Services
{
    public class AIMatchingService
    {
        private readonly ApplicationDbContext _context;
        private readonly GeminiService _geminiService;

        public AIMatchingService(ApplicationDbContext context, GeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        // ---- Async versions (using Gemini) ----

        public async Task<double> CalculateMatchScoreAsync(string candidateSkills, string requiredSkills)
        {
            return await _geminiService.GetMatchScoreAsync(candidateSkills, requiredSkills);
        }

        public async Task<List<JobRecommendation>> RankJobsForCandidateAsync(int candidateId)
        {
            var candidate = await _context.Candidates.FindAsync(candidateId);
            if (candidate == null || string.IsNullOrEmpty(candidate.Skills))
                return new List<JobRecommendation>();

            var activeJobs = await _context.Jobs
                .Where(j => j.IsActive)
                .ToListAsync();

            var recommendations = new List<JobRecommendation>();

            foreach (var job in activeJobs)
            {
                var score = await CalculateMatchScoreAsync(candidate.Skills, job.RequiredSkills ?? "");
                recommendations.Add(new JobRecommendation
                {
                    JobId = job.Id,
                    JobTitle = job.Title,
                    MatchScore = score,
                    MatchPercentage = $"{score:F0}%"
                });
            }

            return recommendations.OrderByDescending(r => r.MatchScore).ToList();
        }

        public async Task<List<RankedCandidate>> RankCandidatesForJobAsync(int jobId)
        {
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null)
                return new List<RankedCandidate>();

            var applications = await _context.Applications
                .Include(a => a.Candidate)
                .Where(a => a.JobId == jobId)
                .ToListAsync();

            var rankedCandidates = new List<RankedCandidate>();

            foreach (var app in applications)
            {
                var candidate = app.Candidate;
                if (candidate == null)
                    continue;

                var score = await CalculateMatchScoreAsync(
                    candidate.Skills ?? "",
                    job.RequiredSkills ?? ""
                );

                rankedCandidates.Add(new RankedCandidate
                {
                    CandidateId = candidate.Id,
                    FullName = candidate.FullName,
                    Email = candidate.Email,
                    Skills = candidate.Skills ?? "Not specified",
                    MatchScore = score,
                    MatchPercentage = $"{score:F0}%"
                });
            }

            return rankedCandidates.OrderByDescending(r => r.MatchScore).ToList();
        }

        // ---- Synchronous fallback (keyword-based) ----

        public double CalculateMatchScore(string candidateSkills, string requiredSkills)
        {
            if (string.IsNullOrWhiteSpace(candidateSkills) || string.IsNullOrWhiteSpace(requiredSkills))
                return 0;

            var candidateSkillList = candidateSkills.Split(',')
                .Select(s => s.Trim().ToLowerInvariant())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();

            var requiredSkillList = requiredSkills.Split(',')
                .Select(s => s.Trim().ToLowerInvariant())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();

            if (!requiredSkillList.Any())
                return 0;

            var matchedSkills = candidateSkillList
                .Where(s => requiredSkillList.Contains(s))
                .Count();

            return (double)matchedSkills / requiredSkillList.Count * 100;
        }

        public List<JobRecommendation> RankJobsForCandidateSync(int candidateId)
        {
            var candidate = _context.Candidates.Find(candidateId);
            if (candidate == null || string.IsNullOrEmpty(candidate.Skills))
                return new List<JobRecommendation>();

            var activeJobs = _context.Jobs.Where(j => j.IsActive).ToList();
            var recommendations = new List<JobRecommendation>();

            foreach (var job in activeJobs)
            {
                var score = CalculateMatchScore(candidate.Skills, job.RequiredSkills ?? "");
                recommendations.Add(new JobRecommendation
                {
                    JobId = job.Id,
                    JobTitle = job.Title,
                    MatchScore = score,
                    MatchPercentage = $"{score:F0}%"
                });
            }

            return recommendations.OrderByDescending(r => r.MatchScore).ToList();
        }

        public List<RankedCandidate> RankCandidatesForJobSync(int jobId)
        {
            var job = _context.Jobs.Find(jobId);
            if (job == null)
                return new List<RankedCandidate>();

            var applications = _context.Applications
                .Include(a => a.Candidate)
                .Where(a => a.JobId == jobId)
                .ToList();

            var rankedCandidates = new List<RankedCandidate>();

            foreach (var app in applications)
            {
                var candidate = app.Candidate;
                if (candidate == null)
                    continue;

                var score = CalculateMatchScore(
                    candidate.Skills ?? "",
                    job.RequiredSkills ?? ""
                );

                rankedCandidates.Add(new RankedCandidate
                {
                    CandidateId = candidate.Id,
                    FullName = candidate.FullName,
                    Email = candidate.Email,
                    Skills = candidate.Skills ?? "Not specified",
                    MatchScore = score,
                    MatchPercentage = $"{score:F0}%"
                });
            }

            return rankedCandidates.OrderByDescending(r => r.MatchScore).ToList();
        }
    }

    // DTOs
    public class JobRecommendation
    {
        public int JobId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public double MatchScore { get; set; }
        public string MatchPercentage { get; set; } = string.Empty;
    }

    public class RankedCandidate
    {
        public int CandidateId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public double MatchScore { get; set; }
        public string MatchPercentage { get; set; } = string.Empty;
    }
}