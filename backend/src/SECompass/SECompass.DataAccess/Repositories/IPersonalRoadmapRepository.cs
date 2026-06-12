using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public interface IPersonalRoadmapRepository : IRepository<PersonalRoadmap>
{
    Task<IEnumerable<PersonalRoadmap>> GetByProfileWithCareerRoadmapAsync(Guid profileId);
    Task<PersonalRoadmap?> GetWithNodesAndProgressAsync(Guid personalRoadmapId);
}
