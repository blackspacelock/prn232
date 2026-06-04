import { gql } from '@apollo/client';

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: UUID!) {
    userById(id: $userId) {
      id
      fullName
      email
      role
      isActive
      avatarUrl
      createdAt
    }
  }
`;

export const GET_PROFILE_WITH_SKILLS = gql`
  query GetProfileWithSkills($userId: UUID!) {
    profileWithSkills(userId: $userId) {
      userId
      bioDescription
      phoneNumber
      university
      major
      studiedYear
      skills {
        id
        profileId
        skillName
        note
        createdAt
      }
    }
  }
`;

export const GET_CAREER_ROLES = gql`
  query GetCareerRoles {
    careerRoles {
      id
      name
      description
      createdAt
    }
  }
`;

export const GET_CAREER_ROADMAPS_BY_ROLE = gql`
  query GetCareerRoadmapsByRole($careerRoleId: UUID!) {
    careerRoadmapsByRole(careerRoleId: $careerRoleId) {
      id
      careerRoleId
      name
      description
      isCustom
      createdAt
    }
  }
`;

export const GET_CAREER_ROADMAP_WITH_NODES = gql`
  query GetCareerRoadmapWithNodes($roadmapId: UUID!) {
    careerRoadmapWithNodes(roadmapId: $roadmapId) {
      id
      careerRoleId
      name
      description
      isCustom
      nodes {
        id
        careerRoadmapId
        nodeId
        parentRoadmapNodeId
        order
        nodeType
        requirementType
        positionX
        positionY
        createdAt
        node {
          id
          parentNodeId
          name
          description
          order
          createdAt
        }
      }
      edges {
        id
        careerRoadmapId
        fromRoadmapNodeId
        toRoadmapNodeId
        edgeType
        createdAt
      }
    }
  }
`;

export const GET_NODE_HIERARCHY = gql`
  query GetNodeHierarchy($rootId: UUID!) {
    nodeHierarchy(rootId: $rootId) {
      id
      parentNodeId
      name
      description
      order
      children {
        id
        parentNodeId
        name
        description
        order
        children {
          id
          parentNodeId
          name
          description
          order
        }
      }
    }
  }
`;

export const GET_NODE_CHILDREN = gql`
  query GetNodeChildren($parentId: UUID!) {
    nodeChildren(parentId: $parentId) {
      id
      parentNodeId
      name
      description
      order
      createdAt
    }
  }
`;

export const GET_PERSONAL_ROADMAPS_BY_PROFILE = gql`
  query GetPersonalRoadmapsByProfile($profileId: UUID!) {
    personalRoadmapsByProfile(profileId: $profileId) {
      id
      profileId
      careerRoadmapId
      note
      progressPercentage
      createdAt
    }
  }
`;

export const GET_PERSONAL_ROADMAP_WITH_PROGRESS = gql`
  query GetPersonalRoadmapWithProgress($personalRoadmapId: UUID!) {
    personalRoadmapWithProgress(personalRoadmapId: $personalRoadmapId) {
      id
      profileId
      careerRoadmapId
      note
      progressPercentage
      createdAt
      nodeProgresses {
        id
        personalRoadmapId
        roadmapNodeId
        nodeId
        status
        note
        createdAt
        roadmapNode {
          id
          careerRoadmapId
          nodeId
          parentRoadmapNodeId
          order
          nodeType
          requirementType
          positionX
          positionY
          createdAt
          node {
            id
            parentNodeId
            name
            description
            order
          }
        }
        node {
          id
          parentNodeId
          name
          description
          order
        }
      }
    }
  }
`;

export const GET_NODE_PROGRESS = gql`
  query GetNodeProgress($personalRoadmapId: UUID!) {
    nodeProgress(personalRoadmapId: $personalRoadmapId) {
      id
      personalRoadmapId
      roadmapNodeId
      nodeId
      status
      note
      createdAt
      roadmapNode {
        id
        careerRoadmapId
        nodeId
        parentRoadmapNodeId
        order
        nodeType
        requirementType
        positionX
        positionY
        node {
          id
          name
          description
          order
        }
      }
      node {
        id
        name
        description
        order
      }
    }
  }
`;

export const GET_LEARNING_RESOURCES_BY_NODE = gql`
  query GetLearningResourcesByNode($nodeId: UUID!) {
    learningResourcesByNode(nodeId: $nodeId) {
      id
      nodeId
      name
      resourceUrl
      resourceType
      provider
      isFree
      createdAt
    }
  }
`;

export const GET_RECOMMENDED_RESOURCES = gql`
  query GetRecommendedResources($profileId: UUID!, $nodeId: UUID!) {
    recommendedResources(profileId: $profileId, nodeId: $nodeId) {
      id
      nodeId
      name
      resourceUrl
      resourceType
      provider
      isFree
      createdAt
    }
  }
`;

export const GET_GITHUB_REPOS_BY_PROFILE = gql`
  query GetGitHubRepositoriesByProfile($profileId: UUID!) {
    gitHubRepositoriesByProfile(profileId: $profileId) {
      id
      profileId
      repositoryName
      repoUrl
      description
      isPrivate
      createdAt
    }
  }
`;

export const GET_PORTFOLIO_ANALYSIS = gql`
  query GetPortfolioAnalysis($profileId: UUID!) {
    portfolioAnalysis(profileId: $profileId) {
      profileId
      repositoryNames
      overallSummary
      strengths
      recommendations
    }
  }
`;

export const GET_CHAT_SESSIONS_BY_PROFILE = gql`
  query GetChatSessionsByProfile($profileId: UUID!) {
    chatSessionsByProfile(profileId: $profileId) {
      id
      profileId
      title
      summary
      createdAt
    }
  }
`;

export const GET_CHAT_SESSION_WITH_MESSAGES = gql`
  query GetChatSessionWithMessages($sessionId: UUID!) {
    chatSessionWithMessages(sessionId: $sessionId) {
      id
      profileId
      title
      summary
      createdAt
      messages {
        id
        chatSessionId
        sender
        messageContent
        createdAt
      }
    }
  }
`;

export const GET_JOB_TRENDS_BY_REGION = gql`
  query GetJobTrendsByRegion($region: String!) {
    jobTrendsByRegion(region: $region) {
      id
      techSkill
      description
      source
      region
      trendScore
      snapshotDate
      createdAt
    }
  }
`;

export const GET_TOP_TRENDING_SKILLS = gql`
  query GetTopTrendingSkills($count: Int!) {
    topTrendingSkills(count: $count) {
      id
      techSkill
      description
      region
      trendScore
      snapshotDate
    }
  }
`;

export const GET_SKILL_GAP_ANALYSIS = gql`
  query GetSkillGapAnalysis($profileId: UUID!, $careerRoadmapId: UUID!) {
    skillGapAnalysis(profileId: $profileId, careerRoadmapId: $careerRoadmapId) {
      profileId
      careerRoadmapId
      existingSkills
      requiredSkills
      missingSkills
      coveragePercentage
      summary
    }
  }
`;

export const GET_TRENDING_SKILL_RECOMMENDATIONS = gql`
  query GetTrendingSkillRecommendations($profileId: UUID!) {
    trendingSkillRecommendations(profileId: $profileId)
  }
`;

export const GET_PROFILE_BY_USER_ID = gql`
  query GetProfileByUserId($userId: UUID!) {
    profileByUserId(userId: $userId) {
      userId
      bioDescription
      phoneNumber
      university
      major
      studiedYear
    }
  }
`;
