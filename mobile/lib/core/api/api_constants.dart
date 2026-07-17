class ApiConstants {
  ApiConstants._();

  // Override this at runtime via envied or .env
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://localhost:7210',
  );

  static const graphqlEndpoint = '$baseUrl/graphql';

  // Auth
  static const login = '/api/auth/login';
  static const register = '/api/auth/register';
  static const googleLogin = '/api/auth/google';
  static const refresh = '/api/auth/refresh';
  static const logout = '/api/auth/logout';

  // Profile
  static const profiles = '/api/profiles';

  // Roadmaps
  static const personalRoadmaps = '/api/personal-roadmaps';
  static const nodeProgress = '/api/node-progress';

  // Skills
  static const skills = '/api/skills';

  // Chat
  static const chatSessions = '/api/chat/sessions';

  // Portfolio
  static const githubRepositories = '/api/github-repositories';
  static const publicPortfolios = '/api/public-portfolios';

  // Users
  static const users = '/api/users';

  // AI
  static const aiPortfolioAnalysis = '/api/ai/portfolio-analysis';

  // Job Trends
  static const jobTrends = '/api/job-trends';
}
