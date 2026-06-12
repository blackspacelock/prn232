using Microsoft.EntityFrameworkCore;
using SECompass.DataAccess.DbContexts;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public class PersonalRoadmapRepository : GenericRepository<PersonalRoadmap>, IPersonalRoadmapRepository
{
    public PersonalRoadmapRepository(AppDbContext context) : base(context) { }

    public async Task<PersonalRoadmap?> GetWithNodesAndProgressAsync(Guid personalRoadmapId)
        => await _dbSet
            .Include(pr => pr.NodeProgresses)
                .ThenInclude(np => np.RoadmapNode)
                    .ThenInclude(rn => rn.Node)
            .Include(pr => pr.CareerRoadmap)
            .FirstOrDefaultAsync(pr => pr.Id == personalRoadmapId);
}
