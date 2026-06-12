using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.GitHubRepository;

namespace SECompass.BusinessLogic.Interfaces;

public interface IGitHubRepositoryService
{
    Task<ServiceResult<GitHubRepositoryDto>> AddAsync(AddGitHubRepoDto dto);
    Task<ServiceResult<List<GitHubRepositoryDto>>> GetByProfileAsync(Guid profileId);
    Task<ServiceResult<bool>> RemoveAsync(Guid repoId);
}
