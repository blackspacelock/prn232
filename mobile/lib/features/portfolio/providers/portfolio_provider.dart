import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/portfolio_models.dart';
import '../../../core/storage/token_storage.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/portfolio_repository.dart';
import '../data/portfolio_repository_impl.dart';

final portfolioRepositoryProvider = Provider<PortfolioRepository>(
  (_) => PortfolioRepositoryImpl(),
);

class PortfolioState {
  const PortfolioState({
    required this.repos,
    this.analysis,
    this.isAnalyzing = false,
  });

  final List<GitHubRepositoryDto> repos;
  final PortfolioAnalysisDto? analysis;
  final bool isAnalyzing;

  PortfolioState copyWith({
    List<GitHubRepositoryDto>? repos,
    PortfolioAnalysisDto? analysis,
    bool clearAnalysis = false,
    bool? isAnalyzing,
  }) {
    return PortfolioState(
      repos: repos ?? this.repos,
      analysis: clearAnalysis ? null : analysis ?? this.analysis,
      isAnalyzing: isAnalyzing ?? this.isAnalyzing,
    );
  }
}

class PortfolioNotifier extends AsyncNotifier<PortfolioState> {
  @override
  Future<PortfolioState> build() async {
    final profileId = await _getProfileId();
    final repos =
        await ref.read(portfolioRepositoryProvider).getRepos(profileId);
    final analysis =
        await ref.read(portfolioRepositoryProvider).getAnalysis(profileId);
    return PortfolioState(repos: repos, analysis: analysis);
  }

  Future<void> addRepo(CreateRepoDto dto) async {
    final repo = await ref.read(portfolioRepositoryProvider).addRepo(dto);
    state = AsyncData(
      state.value!.copyWith(repos: [...state.value!.repos, repo]),
    );
  }

  Future<void> updateRepo(String id, UpdateRepoDto dto) async {
    final updated =
        await ref.read(portfolioRepositoryProvider).updateRepo(id, dto);
    final repos = state.value!.repos
        .map((r) => r.githubRepoId == id ? updated : r)
        .toList();
    state = AsyncData(state.value!.copyWith(repos: repos));
  }

  Future<void> deleteRepo(String id) async {
    await ref.read(portfolioRepositoryProvider).deleteRepo(id);
    final repos =
        state.value!.repos.where((r) => r.githubRepoId != id).toList();
    state = AsyncData(state.value!.copyWith(repos: repos));
  }

  Future<void> runAnalysis() async {
    final current = state.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(isAnalyzing: true));
    try {
      final profileId = await _getProfileId();
      final analysis =
          await ref.read(portfolioRepositoryProvider).runAnalysis(profileId);
      final repos =
          await ref.read(portfolioRepositoryProvider).getRepos(profileId);
      state = AsyncData(state.value!.copyWith(
        repos: repos,
        analysis: analysis,
        isAnalyzing: false,
      ));
    } catch (_) {
      state = AsyncData(state.value!.copyWith(isAnalyzing: false));
      rethrow;
    }
  }

  Future<String> _getProfileId() async {
    final user = ref.read(authProvider).valueOrNull;
    if (user?.profileId != null && user!.profileId!.isNotEmpty) {
      return user.profileId!;
    }
    return await TokenStorage.getProfileId() ??
        await TokenStorage.getUserId() ??
        '';
  }
}

final portfolioProvider =
    AsyncNotifierProvider<PortfolioNotifier, PortfolioState>(
  PortfolioNotifier.new,
);
