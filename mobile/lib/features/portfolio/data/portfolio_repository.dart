import '../../../core/models/portfolio_models.dart';

abstract class PortfolioRepository {
  Future<List<GitHubRepositoryDto>> getRepos(String profileId);
  Future<GitHubRepositoryDto> addRepo(CreateRepoDto dto);
  Future<GitHubRepositoryDto> updateRepo(String id, UpdateRepoDto dto);
  Future<void> deleteRepo(String id);
  Future<PortfolioAnalysisDto?> getAnalysis(String profileId);
  Future<PortfolioAnalysisDto> runAnalysis(String profileId);
}
