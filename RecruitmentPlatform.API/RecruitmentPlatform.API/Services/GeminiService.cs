using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace RecruitmentPlatform.API.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini API Key is missing from configuration.");
        }

        // Method 1: Get match score between candidate skills and job requirements
        public async Task<double> GetMatchScoreAsync(string candidateSkills, string jobRequiredSkills)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(candidateSkills) || string.IsNullOrWhiteSpace(jobRequiredSkills))
                    return 0;

                var prompt = $@"
You are an AI recruitment assistant. Rate how well a candidate with these skills:
'{candidateSkills}'

Matches a job requiring these skills:
'{jobRequiredSkills}'

Return ONLY a number between 0 and 100 representing the match percentage. 
No explanation, just the number.";

                var response = await CallGeminiAsync(prompt);

                // Try to parse the response as a number
                if (double.TryParse(response.Trim(), out double score))
                {
                    return Math.Clamp(score, 0, 100);
                }

                // If parsing fails, try to extract a number from the text
                var match = System.Text.RegularExpressions.Regex.Match(response, @"\d+");
                if (match.Success && double.TryParse(match.Value, out double extractedScore))
                {
                    return Math.Clamp(extractedScore, 0, 100);
                }

                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Gemini API error (GetMatchScore): {ex.Message}");
                return 0; // Fallback to 0 on error
            }
        }

        // Method 2: Extract skills from profile text
        public async Task<string> ExtractSkillsAsync(string profileText)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(profileText))
                    return string.Empty;

                var prompt = $@"
Extract the key professional skills from this text:
'{profileText}'

Return ONLY a comma-separated list of skills, nothing else. 
Maximum 10 skills. If no skills are found, return 'No skills identified'.";

                var response = await CallGeminiAsync(prompt);
                return response.Trim();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Gemini API error (ExtractSkills): {ex.Message}");
                return "No skills identified";
            }
        }

        // Method 3: Generate feedback for a candidate
        public async Task<string> GenerateFeedbackAsync(string candidateName, string jobTitle, double matchScore)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(candidateName) || string.IsNullOrWhiteSpace(jobTitle))
                    return "Unable to generate feedback at this time.";

                var prompt = $@"
Generate a brief 2-3 sentence recruitment feedback for candidate '{candidateName}' 
who has a {matchScore:F0}% match for the position '{jobTitle}'. 
Be professional, constructive, and encouraging. 
Keep it concise and focused on the candidate's fit and potential areas for growth.";

                var response = await CallGeminiAsync(prompt);
                return response.Trim();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Gemini API error (GenerateFeedback): {ex.Message}");
                return $"{candidateName} has a {matchScore:F0}% match for this position. Further evaluation recommended.";
            }
        }

        // Method 4: Generate job recommendations (for bonus features)
        public async Task<string> GenerateJobRecommendationAsync(string candidateSkills, List<string> jobTitles)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(candidateSkills) || jobTitles == null || !jobTitles.Any())
                    return "No recommendations available.";

                var jobList = string.Join(", ", jobTitles);
                var prompt = $@"
Based on a candidate with these skills: '{candidateSkills}'

Which of these jobs would be the best fit, and why?
Available jobs: {jobList}

Return a short recommendation (2-3 sentences) explaining the best fit.";

                var response = await CallGeminiAsync(prompt);
                return response.Trim();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Gemini API error (GenerateJobRecommendation): {ex.Message}");
                return "Recommendation not available.";
            }
        }

        // ----- Private Helper Methods -----

        private async Task<string> CallGeminiAsync(string prompt)
        {
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var url = $"{_endpoint}?key={_apiKey}";
            var response = await _httpClient.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini API error (HTTP {response.StatusCode}): {error}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            return ExtractTextFromGeminiResponse(responseJson);
        }

        private string ExtractTextFromGeminiResponse(string json)
        {
            try
            {
                var doc = JsonDocument.Parse(json);
                var candidates = doc.RootElement.GetProperty("candidates");
                var firstCandidate = candidates[0];
                var content = firstCandidate.GetProperty("content");
                var parts = content.GetProperty("parts");
                var firstPart = parts[0];
                var text = firstPart.GetProperty("text").GetString();
                return text ?? string.Empty;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing Gemini response: {ex.Message}");
                throw new Exception("Failed to parse Gemini API response.");
            }
        }
    }
}