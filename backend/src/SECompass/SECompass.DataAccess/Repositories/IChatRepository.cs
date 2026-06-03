using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public interface IChatRepository : IRepository<ChatSession>
{
    Task<ChatSession?> GetSessionWithMessagesAsync(Guid chatSessionId);
}
