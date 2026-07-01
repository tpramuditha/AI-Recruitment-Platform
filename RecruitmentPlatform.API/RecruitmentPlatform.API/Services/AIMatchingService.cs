using RecruitmentPlatform.API.Models;

namespace RecruitmentPlatform.API.Services
{
    public class AIMatchingService
    {
        /// <summary>
        /// Calculate match score between candidate skills and job required skills
        /// Uses keyword overlap analysis with partial matching
        /// </summary>
        /// <param name="candidateSkills">Comma-separated skills string</param>
        /// <param name="requiredSkills">Comma-separated required skills string</param>
        /// <returns>Match percentage (0-100)</returns>
        public double CalculateMatchScore(string candidateSkills, string requiredSkills)
        {
            // Handle null/empty
            if (string.IsNullOrWhiteSpace(candidateSkills) || string.IsNullOrWhiteSpace(requiredSkills))
                return 0;

            // Parse skills into lists
            var candidateSkillList = ParseSkills(candidateSkills);
            var requiredSkillList = ParseSkills(requiredSkills);

            if (requiredSkillList.Count == 0)
                return 0;

            // Count matches with partial matching
            int matches = 0;
            foreach (var requiredSkill in requiredSkillList)
            {
                if (candidateSkillList.Any(candidateSkill =>
                    candidateSkill.Contains(requiredSkill) ||
                    requiredSkill.Contains(candidateSkill)))
                {
                    matches++;
                }
            }

            // Calculate percentage
            return Math.Round((double)matches / requiredSkillList.Count * 100, 2);
        }

        /// <summary>
        /// Parse a comma-separated skills string into a list of normalized skill strings
        /// </summary>
        private List<string> ParseSkills(string skills)
        {
            if (string.IsNullOrWhiteSpace(skills))
                return new List<string>();

            return skills
                .Split(',')
                .Select(s => s.Trim().ToLowerInvariant())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();
        }

        /// <summary>
        /// Rank jobs for a candidate based on match score
        /// </summary>
        public List<JobMatchResult> RankJobsForCandidate(Candidate candidate, List<Job> jobs)
        {
            if (candidate == null || jobs == null || !jobs.Any())
                return new List<JobMatchResult>();

            var results = new List<JobMatchResult>();

            foreach (var job in jobs)
            {
                // Only rank active jobs
                if (!job.IsActive)
                    continue;

                var score = CalculateMatchScore(candidate.Skills, job.RequiredSkills);

                // Only include jobs with score > 0 (candidate has at least one matching skill)
                if (score > 0)
                {
                    results.Add(new JobMatchResult
                    {
                        JobId = job.Id,
                        Title = job.Title,
                        Department = job.Department,
                        Location = job.Location,
                        EmploymentType = job.EmploymentType,
                        RequiredSkills = job.RequiredSkills,
                        MatchScore = score,
                        MatchPercentage = $"{score}%"
                    });
                }
            }

            // Sort by match score descending (highest first)
            return results.OrderByDescending(r => r.MatchScore).ToList();
        }

        /// <summary>
        /// Rank candidates for a job based on match score
        /// </summary>
        public List<CandidateRankResult> RankCandidatesForJob(Job job, List<Candidate> candidates)
        {
            if (job == null || candidates == null || !candidates.Any())
                return new List<CandidateRankResult>();

            var results = new List<CandidateRankResult>();

            foreach (var candidate in candidates)
            {
                var score = CalculateMatchScore(candidate.Skills, job.RequiredSkills);

                // Only include candidates with score > 0
                if (score > 0)
                {
                    results.Add(new CandidateRankResult
                    {
                        CandidateId = candidate.Id,
                        FullName = candidate.FullName,
                        Email = candidate.Email,
                        Skills = candidate.Skills,
                        MatchScore = score,
                        MatchPercentage = $"{score}%"
                    });
                }
            }

            // Sort by match score descending (highest first)
            return results.OrderByDescending(r => r.MatchScore).ToList();
        }

        /// <summary>
        /// Get match score for a specific candidate-job pair
        /// </summary>
        public double GetMatchScore(Candidate candidate, Job job)
        {
            if (candidate == null || job == null)
                return 0;

            return CalculateMatchScore(candidate.Skills, job.RequiredSkills);
        }
    }

    // ===================== DTOs =====================

    /// <summary>
    /// Result of ranking jobs for a candidate
    /// </summary>
    public class JobMatchResult
    {
        public int JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string RequiredSkills { get; set; } = string.Empty;
        public double MatchScore { get; set; }
        public string MatchPercentage { get; set; } = string.Empty;
    }

    /// <summary>
    /// Result of ranking candidates for a job
    /// </summary>
    public class CandidateRankResult
    {
        public int CandidateId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public double MatchScore { get; set; }
        public string MatchPercentage { get; set; } = string.Empty;
    }

    /// <summary>
    /// Single match score result
    /// </summary>
    public class MatchScoreResult
    {
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public int JobId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public double MatchScore { get; set; }
        public string MatchPercentage { get; set; } = string.Empty;
    }
}