using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SECompass.BusinessLogic.DTOs.Chat;
using SECompass.BusinessLogic.Interfaces;

namespace SECompass.BusinessLogic.Services;

public class OpenAiMentorService : IAiMentorService
{
    private const string FallbackReply =
        "I'm temporarily unable to reach the AI mentor service. Please try again in a moment.";

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OpenAiMentorService> _logger;

    public OpenAiMentorService(HttpClient httpClient, IConfiguration configuration, ILogger<OpenAiMentorService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GetMentorReplyAsync(IReadOnlyList<AiChatMessageDto> conversation, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("OpenAI:ApiKey is not configured; returning fallback mentor reply.");
            return FallbackReply;
        }

        var requestBody = new
        {
            model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini",
            messages = conversation.Select(m => new { role = m.Role, content = m.Content }),
            temperature = 0.7,
            max_tokens = 800
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("OpenAI chat completion failed with {StatusCode}: {Body}", response.StatusCode, body);
                return FallbackReply;
            }

            using var doc = JsonDocument.Parse(body);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return string.IsNullOrWhiteSpace(content) ? FallbackReply : content.Trim();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "OpenAI chat completion request threw an exception.");
            return FallbackReply;
        }
    }
}
