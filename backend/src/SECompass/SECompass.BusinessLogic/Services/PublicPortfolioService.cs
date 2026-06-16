using AutoMapper;
using System.Text.Json;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.AI;
using SECompass.BusinessLogic.DTOs.PublicPortfolio;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class PublicPortfolioService : IPublicPortfolioService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public PublicPortfolioService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<PublicPortfolioDto>> GetByProfileAsync(Guid profileId)
    {
        var portfolio = await GetOrCreateAsync(profileId);
        if (portfolio == null) return ServiceResult<PublicPortfolioDto>.Fail("Profile not found.");

        return ServiceResult<PublicPortfolioDto>.Ok(ToDto(portfolio));
    }

    public async Task<ServiceResult<PublicPortfolioDto>> UpdateAsync(Guid profileId, UpdatePublicPortfolioDto dto)
    {
        var portfolio = await GetOrCreateAsync(profileId);
        if (portfolio == null) return ServiceResult<PublicPortfolioDto>.Fail("Profile not found.");

        _mapper.Map(dto, portfolio);
        _uow.PublicPortfolios.Update(portfolio);
        await _uow.SaveChangesAsync();

        return ServiceResult<PublicPortfolioDto>.Ok(ToDto(portfolio));
    }

    private async Task<PublicPortfolio?> GetOrCreateAsync(Guid profileId)
    {
        var portfolios = await _uow.PublicPortfolios.FindAsync(p => p.ProfileId == profileId);
        var portfolio = portfolios.FirstOrDefault();
        if (portfolio != null) return portfolio;

        var profiles = await _uow.Profiles.FindAsync(p => p.UserId == profileId);
        var profile = profiles.FirstOrDefault();
        if (profile == null) return null;

        portfolio = new PublicPortfolio
        {
            Id = Guid.NewGuid(),
            ProfileId = profileId,
            PublicBio = profile.BioDescription,
            IsPublic = true
        };
        await _uow.PublicPortfolios.AddAsync(portfolio);
        await _uow.SaveChangesAsync();
        return portfolio;
    }

    private PublicPortfolioDto ToDto(PublicPortfolio portfolio)
    {
        var dto = _mapper.Map<PublicPortfolioDto>(portfolio);
        if (!string.IsNullOrWhiteSpace(portfolio.CachedPortfolioAnalysisJson))
        {
            dto.CachedPortfolioAnalysis = JsonSerializer.Deserialize<PortfolioAnalysisDto>(
                portfolio.CachedPortfolioAnalysisJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        return dto;
    }
}
