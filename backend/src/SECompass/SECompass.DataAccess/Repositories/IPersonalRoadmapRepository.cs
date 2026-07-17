using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public interface IPersonalRoadmapRepository : IRepository<PersonalRoadmap>
{
    Task<IEnumerable<PersonalRoadmap>> GetByProfileWithCareerRoadmapAsync(Guid profileId);
    Task<IEnumerable<PersonalRoadmap>> GetByProfileWithProgressAsync(Guid profileId);
    Task<IEnumerable<PersonalRoadmap>> GetSharedWithProgressAsync();
    Task<PersonalRoadmap?> GetWithNodesAndProgressAsync(Guid personalRoadmapId);
    Task<PersonalRoadmap?> GetSharedWithNodesAndProgressAsync(Guid personalRoadmapId);
}
