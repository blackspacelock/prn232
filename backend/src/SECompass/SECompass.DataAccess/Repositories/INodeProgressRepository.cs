using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public interface INodeProgressRepository : IRepository<NodeProgress>
{
    Task<IEnumerable<NodeProgress>> GetByPersonalRoadmapAsync(Guid personalRoadmapId);
    Task BulkInsertAsync(IEnumerable<NodeProgress> entries);
}
