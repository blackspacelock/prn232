using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public interface IPersonalRoadmapRepository : IRepository<PersonalRoadmap>
{
    Task<PersonalRoadmap?> GetWithNodesAndProgressAsync(Guid personalRoadmapId);
}
