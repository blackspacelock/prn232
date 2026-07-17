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
    this.publicPortfolio,
    this.isAnalyzing = false,
    this.isSavingPublicSettings = false,
  });

  final List<GitHubRepositoryDto> repos;
  final PortfolioAnalysisDto? analysis;
  final PublicPortfolioDto? publicPortfolio;
  final bool isAnalyzing;
  final bool isSavingPublicSettings;

  PortfolioState copyWith({
    List<GitHubRepositoryDto>? repos,
    PortfolioAnalysisDto? analysis,
    PublicPortfolioDto? publicPortfolio,
    bool clearAnalysis = false,
    bool? isAnalyzing,
    bool? isSavingPublicSettings,
  }) {
    return PortfolioState(
      repos: repos ?? this.repos,
      analysis: clearAnalysis ? null : analysis ?? this.analysis,
      publicPortfolio: publicPortfolio ?? this.publicPortfolio,
      isAnalyzing: isAnalyzing ?? this.isAnalyzing,
      isSavingPublicSettings:
          isSavingPublicSettings ?? this.isSavingPublicSettings,
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
    final publicPortfolio = await ref
        .read(portfolioRepositoryProvider)
        .getPublicPortfolio(profileId);
    return PortfolioState(
      repos: repos,
      analysis: analysis,
      publicPortfolio: publicPortfolio,
    );
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
      final publicPortfolio = await ref
          .read(portfolioRepositoryProvider)
          .getPublicPortfolio(profileId);
      state = AsyncData(state.value!.copyWith(
        analysis: analysis,
        publicPortfolio: publicPortfolio,
        isAnalyzing: false,
      ));
    } catch (_) {
      state = AsyncData(state.value!.copyWith(isAnalyzing: false));
      rethrow;
    }
  }

  Future<void> updatePublicPortfolio(UpdatePublicPortfolioDto dto) async {
    final current = state.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(isSavingPublicSettings: true));
    try {
      final profileId = await _getProfileId();
      final updated = await ref
          .read(portfolioRepositoryProvider)
          .updatePublicPortfolio(profileId, dto);
      state = AsyncData(
        state.value!.copyWith(
          publicPortfolio: updated,
          isSavingPublicSettings: false,
        ),
      );
      final userId = ref.read(authProvider).valueOrNull?.id ??
          await TokenStorage.getUserId();
      if (userId != null && userId.isNotEmpty) {
        ref.invalidate(publicPortfolioProvider(userId));
      }
    } catch (_) {
      state = AsyncData(
        state.value!.copyWith(isSavingPublicSettings: false),
      );
      rethrow;
    }
  }

  Future<String> _getProfileId() async {
    final user = ref.read(authProvider).valueOrNull;
    if (user?.profileId != null && user!.profileId!.isNotEmpty) {
      return user.profileId!;
    }
    return await TokenStorage.getProfileId() ?? '';
  }
}

final portfolioProvider =
    AsyncNotifierProvider<PortfolioNotifier, PortfolioState>(
  PortfolioNotifier.new,
);

final publicPortfolioProvider =
    FutureProvider.family<PublicPortfolioViewData, String>((ref, userId) {
  return ref.read(portfolioRepositoryProvider).getPublicPortfolioView(userId);
});
