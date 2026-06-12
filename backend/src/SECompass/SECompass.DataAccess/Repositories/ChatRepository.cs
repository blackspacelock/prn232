using Microsoft.EntityFrameworkCore;
using SECompass.DataAccess.DbContexts;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public class ChatRepository : GenericRepository<ChatSession>, IChatRepository
{
    public ChatRepository(AppDbContext context) : base(context) { }

    public async Task<ChatSession?> GetSessionWithMessagesAsync(Guid chatSessionId)
        => await _dbSet
            .Include(s => s.ChatMessages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(s => s.Id == chatSessionId);
}
