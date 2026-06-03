using Microsoft.EntityFrameworkCore;
using SECompass.DataAccess.DbContexts;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public class NodeProgressRepository : GenericRepository<NodeProgress>, INodeProgressRepository
{
    public NodeProgressRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<NodeProgress>> GetByPersonalRoadmapAsync(Guid personalRoadmapId)
        => await _dbSet
            .Include(np => np.Node)
            .Where(np => np.PersonalRoadmapId == personalRoadmapId)
            .ToListAsync();

    public async Task BulkInsertAsync(IEnumerable<NodeProgress> entries)
        => await _dbSet.AddRangeAsync(entries);
}
