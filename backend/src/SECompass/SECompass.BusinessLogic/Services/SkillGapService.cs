using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Skill;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Enums;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class SkillGapService : ISkillGapService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public SkillGapService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<SkillGapAnalysisDto>> AnalyzeSkillGapAsync(Guid profileId, Guid? careerRoadmapId = null)
    {
        var personalRoadmaps = await _uow.PersonalRoadmaps.FindAsync(pr =>
            pr.ProfileId == profileId &&
            (careerRoadmapId == null ? pr.IsActive : pr.CareerRoadmapId == careerRoadmapId.Value));
        var targetRoadmap = personalRoadmaps.FirstOrDefault();
        if (targetRoadmap == null && careerRoadmapId == null)
            return ServiceResult<SkillGapAnalysisDto>.Fail("No active roadmap found. Set a roadmap as active to see your skill gap analysis.");

        var targetCareerRoadmapId = careerRoadmapId ?? targetRoadmap!.CareerRoadmapId;

        var profileSkillLinks = await _uow.ProfileTechnicalSkills.FindAsync(s => s.ProfileId == profileId);
        var profileSkillIds = profileSkillLinks.Select(s => s.TechnicalSkillId).ToHashSet();

        if (targetRoadmap != null)
        {
            var completedProgresses = await _uow.NodeProgresses.FindAsync(np =>
                np.PersonalRoadmapId == targetRoadmap.Id && np.Status == NodeProgressStatus.Completed);
            var completedRoadmapNodeIds = completedProgresses.Select(np => np.RoadmapNodeId).Distinct().ToList();
            var completedRoadmapNodes = await _uow.RoadmapNodes.FindAsync(rn => completedRoadmapNodeIds.Contains(rn.Id));
            var completedNodeIds = completedRoadmapNodes.Select(rn => rn.NodeId).Distinct().ToList();
            if (completedNodeIds.Count > 0)
            {
                var completedSkillLinks = await _uow.NodeTechnicalSkills.FindAsync(nts => completedNodeIds.Contains(nts.NodeId));
                foreach (var skillId in completedSkillLinks.Select(nts => nts.TechnicalSkillId))
                    profileSkillIds.Add(skillId);
            }
        }

        var roadmapNodes = await _uow.RoadmapNodes.FindAsync(rn => rn.CareerRoadmapId == targetCareerRoadmapId);
        var nodeIds = roadmapNodes.Select(rn => rn.NodeId).Distinct().ToList();

        var nodeSkillLinks = await _uow.NodeTechnicalSkills.FindAsync(nts => nodeIds.Contains(nts.NodeId));
        var requiredSkillIds = nodeSkillLinks.Select(nts => nts.TechnicalSkillId).Distinct().ToList();

        var requiredSkills = (await _uow.TechnicalSkills.FindAsync(t => requiredSkillIds.Contains(t.Id)))
            .OrderBy(s => s.Category).ThenBy(s => s.Name).ToList();

        var matchedSkills = requiredSkills.Where(s => profileSkillIds.Contains(s.Id)).ToList();
        var missingSkills = requiredSkills.Where(s => !profileSkillIds.Contains(s.Id)).ToList();

        var coverage = requiredSkills.Count == 0 ? 100.0 : matchedSkills.Count * 100.0 / requiredSkills.Count;

        var categoryBreakdown = requiredSkills
            .GroupBy(s => s.Category)
            .Select(g => new SkillGapCategoryDto
            {
                Category = g.Key,
                YourLevel = Math.Round(g.Count(s => profileSkillIds.Contains(s.Id)) * 100.0 / g.Count(), 2),
                RequiredLevel = 100
            })
            .OrderBy(c => c.Category)
            .ToList();

        var dto = new SkillGapAnalysisDto
        {
            ProfileId = profileId,
            CareerRoadmapId = targetCareerRoadmapId,
            RequiredSkills = _mapper.Map<List<TechnicalSkillDto>>(requiredSkills),
            MatchedSkills = _mapper.Map<List<TechnicalSkillDto>>(matchedSkills),
            MissingSkills = _mapper.Map<List<TechnicalSkillDto>>(missingSkills),
            CategoryBreakdown = categoryBreakdown,
            CoveragePercentage = Math.Round(coverage, 2),
            Summary = $"You match {matchedSkills.Count} of {requiredSkills.Count} skills required for this roadmap. {missingSkills.Count} skills are still needed."
        };

        return ServiceResult<SkillGapAnalysisDto>.Ok(dto);
    }
}
