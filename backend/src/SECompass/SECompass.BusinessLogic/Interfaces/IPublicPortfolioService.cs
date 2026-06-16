using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.PublicPortfolio;

namespace SECompass.BusinessLogic.Interfaces;

public interface IPublicPortfolioService
{
    Task<ServiceResult<PublicPortfolioDto>> GetByProfileAsync(Guid profileId);
    Task<ServiceResult<PublicPortfolioDto>> UpdateAsync(Guid profileId, UpdatePublicPortfolioDto dto);
}
