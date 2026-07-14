using Microsoft.EntityFrameworkCore;
using SECompass.DataAccess.DbContexts;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public class PersonalRoadmapRepository : GenericRepository<PersonalRoadmap>, IPersonalRoadmapRepository
{
    public PersonalRoadmapRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<PersonalRoadmap>> GetByProfileWithCareerRoadmapAsync(Guid profileId)
        => await _dbSet
            .Include(pr => pr.CareerRoadmap)
            .Where(pr => pr.ProfileId == profileId)
            .OrderByDescending(pr => pr.IsActive)
            .ThenByDescending(pr => pr.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<PersonalRoadmap>> GetByProfileWithProgressAsync(Guid profileId)
        => await _dbSet
            .Include(pr => pr.CareerRoadmap)
            .Include(pr => pr.Tags)
            .Include(pr => pr.NodeProgresses)
                .ThenInclude(np => np.RoadmapNode)
                    .ThenInclude(rn => rn.Node)
            .Where(pr => pr.ProfileId == profileId)
            .OrderByDescending(pr => pr.IsActive)
            .ThenByDescending(pr => pr.CreatedAt)
            .ToListAsync();

    public async Task<PersonalRoadmap?> GetWithNodesAndProgressAsync(Guid personalRoadmapId)
        => await _dbSet
            .Include(pr => pr.Tags)
            .Include(pr => pr.NodeProgresses)
                .ThenInclude(np => np.RoadmapNode)
                    .ThenInclude(rn => rn.Node)
            .Include(pr => pr.CareerRoadmap)
            .FirstOrDefaultAsync(pr => pr.Id == personalRoadmapId);
}
