import type { NodeStatusInt } from '@/constants/nodeStatus';

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: string;
  fullName: string;
  email: string;
  role: number;
  avatarUrl?: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  fullName: string;
}

export interface GoogleLoginDto {
  idToken: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

// Must match backend UpdateUserDto exactly
export interface UpdateUserDto {
  fullName?: string;
  avatarUrl?: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: number;
  isActive: boolean;
  googleId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AdminUpdateUserDto extends UpdateUserDto {
  role?: number;
  isActive?: boolean;
}

export interface AdminMetricPointDto {
  label: string;
  value: number;
}

export interface AdminOverviewDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  mentorUsers: number;
  studentUsers: number;
  careerRoles: number;
  roadmapTemplates: number;
  contentNodes: number;
  personalRoadmaps: number;
  gitHubRepositories: number;
  publicPortfolios: number;
  chatSessions: number;
  averageRoadmapProgress: number;
  scrapingEnabled: boolean;
  activeScrapingSources: number;
  lastScrapingRunAt?: string;
  monthlyRegistrations: AdminMetricPointDto[];
  roleBreakdown: AdminMetricPointDto[];
  contentInventory: AdminMetricPointDto[];
  topJobTrends: Array<{
    id: string;
    techSkill: string;
    description?: string;
    source?: string;
    region?: string;
    trendScore: number;
    snapshotDate: string;
    createdAt: string;
  }>;
  recentUsers: UserDto[];
}

// Must match backend UpdateProfileDto exactly (camelCase for JSON serialization)
export interface UpdateProfileDto {
  bioDescription?: string;
  phoneNumber?: string;
  university?: string;
  major?: string;
  studiedYear?: number;
}

// Must match backend AddSkillDto exactly
export interface AddSkillDto {
  profileId: string;
  skillName: string;
  note?: string;
}

// Matches backend TechnicalSkillDto
export interface TechnicalSkillDto {
  id: string;
  name: string;
  category: string;
}

// Matches backend SkillDto (a user's ProfileTechnicalSkill entry)
export interface SkillDto {
  id: string;
  profileId: string;
  technicalSkillId: string;
  skillName: string;
  category: string;
  note?: string;
  createdAt: string;
}

// Matches backend ProfileWithSkillsDto
export interface ProfileWithSkillsDto {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  bioDescription?: string;
  phoneNumber?: string;
  university?: string;
  major?: string;
  studiedYear?: number;
  skills: SkillDto[];
}

// Matches backend SkillGapCategoryDto
export interface SkillGapCategoryDto {
  category: string;
  yourLevel: number;
  requiredLevel: number;
}

// Matches backend SkillGapAnalysisDto
export interface SkillGapAnalysisDto {
  profileId: string;
  careerRoadmapId: string;
  requiredSkills: TechnicalSkillDto[];
  matchedSkills: TechnicalSkillDto[];
  missingSkills: TechnicalSkillDto[];
  categoryBreakdown: SkillGapCategoryDto[];
  coveragePercentage: number;
  summary: string;
}

// Must match backend AddGitHubRepoDto exactly
export interface AddGitHubRepoDto {
  profileId: string;
  repositoryName: string;
  repoUrl: string;
  description?: string;
  isPrivate: boolean;
}

export interface UpdateGitHubRepoDto {
  repositoryName?: string;
  repoUrl?: string;
  description?: string;
  isPrivate?: boolean;
}

// Matches backend GitHubRepositoryDto
export interface GitHubRepositoryDto {
  id: string;
  profileId: string;
  repositoryName: string;
  repoUrl: string;
  description?: string;
  isPrivate: boolean;
  createdAt: string;
}

// Matches backend RepositoryAnalysisDto
export interface RepositoryAnalysisDto {
  repositoryId: string;
  repositoryName: string;
  objective: string;
  techStacks: string[];
  summary: string;
}

// Matches backend PortfolioAnalysisDto
export interface PortfolioAnalysisDto {
  profileId: string;
  repositoryNames: string[];
  overallSummary: string;
  strengths: string[];
  recommendations: string[];
  repositoryAnalyses: RepositoryAnalysisDto[];
}

export interface PublicPortfolioDto {
  id: string;
  profileId: string;
  headline?: string;
  publicBio?: string;
  location?: string;
  websiteUrl?: string;
  linkedInUrl?: string;
  contactEmail?: string;
  isPublic: boolean;
  lastAnalyzedAt?: string;
  cachedPortfolioAnalysis?: PortfolioAnalysisDto;
}

// Must match backend SendMessageDto exactly
export interface SendMessageDto {
  sender: string;
  messageContent: string;
}

// Must match backend CreateChatSessionDto (profileId passed as query param separately)
export interface CreateChatSessionDto {
  profileId: string;
  title: string;
}

export interface UpdateNodeProgressStatusDto {
  status: 0 | 1 | 2 | 3 | 4;
  note?: string;
}

// Matches backend NodeDto
export interface NodeDto {
  id: string;
  parentNodeId?: string;
  name: string;
  description?: string;
  order: number;
  createdAt?: string;
}

export interface RoadmapNodeDto {
  id: string;
  careerRoadmapId: string;
  nodeId: string;
  parentRoadmapNodeId?: string;
  order: number;
  nodeType: string;
  requirementType: string;
  positionX?: number;
  positionY?: number;
  createdAt: string;
  node: NodeDto;
}

export interface CreateRoadmapNodeDto {
  nodeId: string;
  parentRoadmapNodeId?: string;
  order: number;
  nodeType?: string;
  requirementType?: string;
  positionX?: number;
  positionY?: number;
}

export interface UpdateRoadmapNodeDto {
  parentRoadmapNodeId?: string;
  order?: number;
  nodeType?: string;
  requirementType?: string;
  positionX?: number;
  positionY?: number;
}

export interface RoadmapNodeEdgeDto {
  id: string;
  careerRoadmapId: string;
  fromRoadmapNodeId: string;
  toRoadmapNodeId: string;
  edgeType: string;
  createdAt: string;
}

// Matches backend NodeProgressDto (id field, not nodeProgressId)
export interface NodeProgressDto {
  id: string;
  personalRoadmapId: string;
  roadmapNodeId: string;
  nodeId: string;
  status: NodeStatusInt;
  note?: string;
  roadmapNode: RoadmapNodeDto;
  node: NodeDto;
}

// Matches backend PersonalRoadmapDto
export interface PersonalRoadmapDto {
  id: string;
  profileId: string;
  careerRoadmapId: string;
  careerRoadmapName: string;
  careerRoadmapDescription?: string;
  note?: string;
  progressPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export interface PersonalRoadmapDetailDto {
  id: string;
  profileId: string;
  careerRoadmapId: string;
  careerRoadmapName: string;
  careerRoadmapDescription?: string;
  note?: string;
  progressPercentage: number;
  isActive: boolean;
  nodeProgresses: NodeProgressDto[];
}

export interface GeneratePersonalRoadmapRequestDto {
  profileId: string;
  careerRoadmapId: string;
}

export interface RoadmapNodeData {
  label: string;
  status: NodeStatusInt;
  nodeId: string;
  nodeProgressId: string;
}

export interface CareerRoleDto {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CareerRoadmapDto {
  id: string;
  careerRoleId: string;
  name: string;
  description?: string;
  isCustom: boolean;
  createdAt: string;
}

export interface CareerRoadmapWithNodesDto extends CareerRoadmapDto {
  nodes: RoadmapNodeDto[];
  edges: RoadmapNodeEdgeDto[];
}

export interface LearningResourceDto {
  id: string;
  nodeId: string;
  name: string;
  resourceUrl: string;
  resourceType: string;
  provider?: string;
  isFree: boolean;
  createdAt: string;
}

// Matches backend JobTrendScrapeSourceResultDto
export interface JobTrendScrapeSourceResultDto {
  sourceName: string;
  region: string;
  postingsScraped: number;
  success: boolean;
  error?: string;
}

// Matches backend JobTrendScrapeResultDto
export interface JobTrendScrapeResultDto {
  snapshotDate: string;
  totalPostingsScraped: number;
  trendsCreated: number;
  trendsUpdated: number;
  sources: JobTrendScrapeSourceResultDto[];
}

// Matches backend JobScrapingSettingDto
export interface JobScrapingSettingDto {
  id: string;
  enabled: boolean;
  frequency: 'Daily' | 'Weekly';
  timeOfDay: string;
  dayOfWeek: string;
  lastRunAt?: string;
}

// Matches backend UpdateJobScrapingSettingDto
export interface UpdateJobScrapingSettingDto {
  enabled: boolean;
  frequency: 'Daily' | 'Weekly';
  timeOfDay: string;
  dayOfWeek: string;
}

// Matches backend JobScrapingSourceDto
export interface JobScrapingSourceDto {
  id: string;
  name: string;
  region: string;
  enabled: boolean;
  url: string;
  jobCardXPath: string;
  titleXPath: string;
  tagsXPath: string;
  maxPostings: number;
}

// Matches backend CreateJobScrapingSourceDto
export interface CreateJobScrapingSourceDto {
  name: string;
  region: string;
  enabled: boolean;
  url: string;
  jobCardXPath: string;
  titleXPath: string;
  tagsXPath: string;
  maxPostings: number;
}

// Matches backend UpdateJobScrapingSourceDto
export interface UpdateJobScrapingSourceDto {
  name?: string;
  region?: string;
  enabled?: boolean;
  url?: string;
  jobCardXPath?: string;
  titleXPath?: string;
  tagsXPath?: string;
  maxPostings?: number;
}
