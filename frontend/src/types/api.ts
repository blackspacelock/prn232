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

// Must match backend AddGitHubRepoDto exactly
export interface AddGitHubRepoDto {
  profileId: string;
  repositoryName: string;
  repoUrl: string;
  description?: string;
  isPrivate: boolean;
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
}

// Matches backend NodeProgressDto (id field, not nodeProgressId)
export interface NodeProgressDto {
  id: string;
  personalRoadmapId: string;
  nodeId: string;
  status: NodeStatusInt;
  note?: string;
  node: NodeDto;
}

export interface PersonalRoadmapDetailDto {
  id: string;
  profileId: string;
  careerRoadmapId: string;
  note?: string;
  progressPercentage: number;
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
  nodes: NodeDto[];
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
