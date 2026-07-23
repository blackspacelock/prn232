class ApiConstants {
  ApiConstants._();

  // Override this at runtime via envied or .env
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue:
        'https://secompass-api-gndnb0erdecjf2d0.southeastasia-01.azurewebsites.net',
  );

  static const graphqlEndpoint = '$baseUrl/graphql';
  static const webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: 'https://prn232-nine.vercel.app',
  );
  static const googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue:
        '1066573154515-pgiqct5pra74rj7bc2583kbo3lgvfgot.apps.googleusercontent.com',
  );

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

  // Users
  static const users = '/api/users';

  // AI
  static const aiPortfolioAnalysis = '/api/ai/portfolio-analysis';

  // Job Trends
  static const jobTrends = '/api/job-trends';
}
