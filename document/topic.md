# Topic
Personalized Career Orientation & Learning Roadmap Platform for Software Engineering Students
## Context
The Software Engineering (SE) field is vast. Students often graduate as "generalists" who know a little of everything but aren't job-ready for specialized roles like "Cloud Architect" or "Data Engineer." Choosing a track early (by year 2 or 3) is crucial for securing high-quality internships.
## Problems
- Skill Gaps: Traditional university curricula often lag 2-3 years behind industry standards (e.g., teaching old frameworks while the market has moved on).
- Choice Paralysis: Students are overwhelmed by too many "Roadmaps" online and don't know which one fits their specific grades and interests.
- Disconnected Portfolios: Students build random projects that don't tell a coherent "story" to potential employers.
## Primary Actors
- SE Student
- Academic Counselor
- Industry Mentor
## Main entity
- Student Profile
- Tech Path,
- Skill Node
- Course Repo
- Job Trend
- Mentor Session
## Research Questions
- How can AI identify a student's "latent talent" (e.g., logical thinking vs. UI/UX flair) through their coding patterns?
- How effective is a dynamic roadmap that updates based on real-time LinkedIn job trend analysis?
## Functional Requirements
1. AI Virtual Mentor:
FR1.1: The system must allow students to submit career-related questions via a natural language chat interface.
FR1.2: The system must integrate LLM APIs (e.g., GPT-4 or Gemini) to process queries and provide technical career advice.
FR1.3: The system must be able to retrieve and analyze data from user-uploaded transcripts and public GitHub profiles to personalize responses.
2. Dynamic Roadmap:
FR2.1: The system must allow users to select a specific "Target Career Role" (e.g., DevOps Engineer, Mobile Developer).
FR2.2: The system must automatically generate a hierarchical Skill Tree (Roadmap) showing technical nodes in a prioritized learning sequence.
FR2.3: The system must provide at least two curated learning resource links (e.g., YouTube, Documentation) for every technical node.
FR2.4: The system must allow users to mark nodes as "Completed" and update the overall roadmap progress in real-time.
3. Skill Gap Analysis:
FR3.1: The system must allow users to manually input or select their current technical skills from a predefined list.
FR3.2: The system must perform a mapping analysis between the user's current skills and the requirements of the Target Career Role.
FR3.3: The system must generate a visual report or PDF identifying missing skills and suggesting an urgent learning priority list.
4. Market Pulse:
FR4.1: The system must automatically scrape data from major IT job portals (e.g., LinkedIn, TopCV) on a daily scheduled basis.
FR4.2: The system must perform keyword frequency analysis on job descriptions to identify trending technologies.
FR4.3: The system must display interactive trend charts showing the growth or decline in demand for specific IT skills.
5. E-Portfolio Management:
FR5.1: The system must allow users to link their GitHub accounts and synchronize a list of their public repositories.
FR5.2: The system must use AI to extract and summarize project objectives and tech-stacks directly from the "README.md" files.
FR5.3: The system must generate a unique, shareable URL for the user's E-Portfolio to be sent to potential employers.
6. User Management:
FR6.1: The system must support user authentication via Email/Password and Google OAuth 2.0.
FR6.2: The system must store and maintain a persistent database of user chat history, skill assessments, and roadmap progress.

## Role 
0 = Admin
1 = Manager
2 = RoadmapUser

## Status
0 = NotStarted
1 = InProgress
2 = Paused
3 = Skipped
4 = Completed