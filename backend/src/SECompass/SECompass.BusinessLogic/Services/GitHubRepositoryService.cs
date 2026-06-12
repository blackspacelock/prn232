using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.GitHubRepository;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class GitHubRepositoryService : IGitHubRepositoryService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GitHubRepositoryService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<GitHubRepositoryDto>> AddAsync(AddGitHubRepoDto dto)
    {
        var repo = new GitHubRepository
        {
            Id = Guid.NewGuid(),
            ProfileId = dto.ProfileId,
            RepositoryName = dto.RepositoryName,
            RepoUrl = dto.RepoUrl,
            Description = dto.Description,
            IsPrivate = dto.IsPrivate
        };
        await _uow.GitHubRepositories.AddAsync(repo);
        await _uow.SaveChangesAsync();
        return ServiceResult<GitHubRepositoryDto>.Ok(_mapper.Map<GitHubRepositoryDto>(repo));
    }

    public async Task<ServiceResult<List<GitHubRepositoryDto>>> GetByProfileAsync(Guid profileId)
    {
        var repos = await _uow.GitHubRepositories.FindAsync(r => r.ProfileId == profileId);
        return ServiceResult<List<GitHubRepositoryDto>>.Ok(_mapper.Map<List<GitHubRepositoryDto>>(repos));
    }

    public async Task<ServiceResult<GitHubRepositoryDto>> UpdateAsync(Guid repoId, UpdateGitHubRepoDto dto)
    {
        var repo = await _uow.GitHubRepositories.GetByIdAsync(repoId);
        if (repo == null) return ServiceResult<GitHubRepositoryDto>.Fail("Repository not found.");

        if (dto.RepositoryName != null) repo.RepositoryName = dto.RepositoryName;
        if (dto.RepoUrl != null) repo.RepoUrl = dto.RepoUrl;
        if (dto.Description != null) repo.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description;
        if (dto.IsPrivate.HasValue) repo.IsPrivate = dto.IsPrivate.Value;

        _uow.GitHubRepositories.Update(repo);
        await _uow.SaveChangesAsync();

        repo = await _uow.GitHubRepositories.GetByIdAsync(repoId) ?? repo;
        return ServiceResult<GitHubRepositoryDto>.Ok(_mapper.Map<GitHubRepositoryDto>(repo));
    }

    public async Task<ServiceResult<bool>> RemoveAsync(Guid repoId)
    {
        var repo = await _uow.GitHubRepositories.GetByIdAsync(repoId);
        if (repo == null) return ServiceResult<bool>.Fail("Repository not found.");
        _uow.GitHubRepositories.Delete(repo);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
