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

export interface UpdateNodeProgressStatusDto {
  status: 0 | 1 | 2 | 3 | 4;
  note?: string;
}

export interface NodeDto {
  id: string;
  title: string;
  description?: string;
  positionX: number;
  positionY: number;
  childIds?: string[];
}

export interface NodeProgressDto {
  nodeProgressId: string;
  nodeId: string;
  status: 0 | 1 | 2 | 3 | 4;
  note?: string;
  node: NodeDto;
}

export interface PersonalRoadmapDetailDto {
  id: string;
  title: string;
  profileId: string;
  careerRoadmapId: string;
  nodeProgress: NodeProgressDto[];
}

export interface GeneratePersonalRoadmapRequestDto {
  profileId: string;
  careerRoadmapId: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}

export interface CreateSkillDto {
  profileId: string;
  skillName: string;
  proficiencyLevel: number;
}

export interface CreateGitHubRepositoryDto {
  profileId: string;
  repositoryUrl: string;
  description?: string;
}

export interface CreateChatSessionDto {
  profileId: string;
  title: string;
}

export interface SendMessageDto {
  content: string;
  role: 'User';
}

export interface RoadmapNodeData {
  label: string;
  status: NodeStatusInt;
  nodeId: string;
  nodeProgressId: string;
}
