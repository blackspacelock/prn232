SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;

DECLARE @Now datetime2 = SYSUTCDATETIME();
DECLARE @RoleId uniqueidentifier;
DECLARE @RoadmapId uniqueidentifier;

SELECT @RoleId = CareerRoleId
FROM CareerRoles
WHERE Name = N'Software Architect' AND IsDeleted = 0;

IF @RoleId IS NULL
BEGIN
    SET @RoleId = '10000000-0000-0000-0000-000000000001';

    INSERT INTO CareerRoles (CareerRoleId, Name, Description, CreatedAt, IsDeleted)
    VALUES (
        @RoleId,
        N'Software Architect',
        N'Designs high-level software systems, architecture decisions, and technical direction.',
        @Now,
        0);
END
ELSE
BEGIN
    UPDATE CareerRoles
    SET Description = N'Designs high-level software systems, architecture decisions, and technical direction.',
        UpdatedAt = @Now
    WHERE CareerRoleId = @RoleId;
END;

SELECT @RoadmapId = CareerRoadmapId
FROM CareerRoadmaps
WHERE CareerRoleId = @RoleId
  AND Name = N'Software Architect Visual Roadmap'
  AND IsDeleted = 0;

IF @RoadmapId IS NULL
BEGIN
    SET @RoadmapId = '20000000-0000-0000-0000-000000000001';

    INSERT INTO CareerRoadmaps (CareerRoadmapId, CareerRoleId, Name, Description, IsCustom, CreatedAt, IsDeleted)
    VALUES (
        @RoadmapId,
        @RoleId,
        N'Software Architect Visual Roadmap',
        N'A roadmap.sh-style sample roadmap with positioned nodes, hierarchy, dependency edges, and resources for frontend visual testing.',
        0,
        @Now,
        0);
END
ELSE
BEGIN
    UPDATE CareerRoadmaps
    SET Description = N'A roadmap.sh-style sample roadmap with positioned nodes, hierarchy, dependency edges, and resources for frontend visual testing.',
        IsCustom = 0,
        UpdatedAt = @Now
    WHERE CareerRoadmapId = @RoadmapId;
END;

DECLARE @Nodes TABLE (
    NodeId uniqueidentifier PRIMARY KEY,
    Name nvarchar(255) NOT NULL,
    Description nvarchar(max) NULL,
    SortOrder int NOT NULL
);

INSERT INTO @Nodes (NodeId, Name, Description, SortOrder)
VALUES
('30000000-0000-0000-0000-000000000001', N'Understand the Basics', N'Core architecture responsibilities, decisions, and tradeoffs.', 1),
('30000000-0000-0000-0000-000000000002', N'What is Software Architecture', N'Learn what architecture means beyond code structure.', 1),
('30000000-0000-0000-0000-000000000003', N'Architecture Responsibilities', N'Understand technical leadership, standards, mentoring, and system quality.', 2),
('30000000-0000-0000-0000-000000000004', N'Architecture Styles', N'Compare layered, microservices, serverless, and distributed architectures.', 3),
('30000000-0000-0000-0000-000000000005', N'Programming Languages', N'Use at least one backend language deeply and understand ecosystem tradeoffs.', 2),
('30000000-0000-0000-0000-000000000006', N'C# / .NET', N'Backend development with C#, ASP.NET Core, and the .NET ecosystem.', 1),
('30000000-0000-0000-0000-000000000007', N'JavaScript / TypeScript', N'Frontend and full-stack development with modern JavaScript and TypeScript.', 2),
('30000000-0000-0000-0000-000000000008', N'Java / Spring', N'Enterprise backend development with Java and Spring.', 3),
('30000000-0000-0000-0000-000000000009', N'Technical Skills', N'Hands-on tools expected from a senior engineer or architect.', 3),
('30000000-0000-0000-0000-000000000010', N'Git and GitHub', N'Branching, pull requests, collaboration, and release workflows.', 1),
('30000000-0000-0000-0000-000000000011', N'Documentation', N'Architecture decision records, diagrams, and technical design documents.', 2),
('30000000-0000-0000-0000-000000000012', N'Communication', N'Explain technical tradeoffs clearly to engineers and stakeholders.', 3),
('30000000-0000-0000-0000-000000000013', N'Patterns and Design Principles', N'Common patterns, SOLID, coupling, cohesion, and maintainability.', 4),
('30000000-0000-0000-0000-000000000014', N'SOLID', N'Principles for maintainable object-oriented design.', 1),
('30000000-0000-0000-0000-000000000015', N'Domain-Driven Design', N'Model complex business domains using bounded contexts and ubiquitous language.', 2),
('30000000-0000-0000-0000-000000000016', N'Microservices', N'Design independent services with clear ownership and communication boundaries.', 3),
('30000000-0000-0000-0000-000000000017', N'Security', N'Authentication, authorization, threat modeling, and secure architecture.', 5),
('30000000-0000-0000-0000-000000000018', N'OAuth2 / OpenID Connect', N'Identity standards for modern web and API systems.', 1),
('30000000-0000-0000-0000-000000000019', N'API Security', N'Protect APIs with validation, rate limits, token handling, and secure defaults.', 2),
('30000000-0000-0000-0000-000000000020', N'Working with Data', N'Database selection, modeling, analytics, and data processing tradeoffs.', 6),
('30000000-0000-0000-0000-000000000021', N'SQL Databases', N'Relational schema design, indexing, query performance, and transactions.', 1),
('30000000-0000-0000-0000-000000000022', N'NoSQL Databases', N'Document, key-value, graph, and wide-column database tradeoffs.', 2),
('30000000-0000-0000-0000-000000000023', N'APIs and Integrations', N'Design REST, GraphQL, events, and integration contracts.', 7),
('30000000-0000-0000-0000-000000000024', N'REST and GraphQL', N'API styles, schema design, versioning, and client contracts.', 1),
('30000000-0000-0000-0000-000000000025', N'Messaging Queues', N'Async communication, retries, ordering, and eventual consistency.', 2),
('30000000-0000-0000-0000-000000000026', N'Operations Knowledge', N'Deployment, observability, reliability, and production operations.', 8),
('30000000-0000-0000-0000-000000000027', N'CI/CD', N'Automated build, test, release, and deployment pipelines.', 1),
('30000000-0000-0000-0000-000000000028', N'Containers', N'Docker, image design, orchestration basics, and runtime concerns.', 2),
('30000000-0000-0000-0000-000000000029', N'Cloud Providers', N'Understand cloud services, deployment models, and cost/reliability tradeoffs.', 3),
('30000000-0000-0000-0000-000000000030', N'Enterprise Software', N'ERP, CRM, integration platforms, and large-organization constraints.', 9);

MERGE Nodes AS target
USING @Nodes AS source
ON target.NodeId = source.NodeId
WHEN MATCHED THEN
    UPDATE SET
        target.Name = source.Name,
        target.Description = source.Description,
        target.[Order] = source.SortOrder,
        target.IsDeleted = 0,
        target.UpdatedAt = @Now
WHEN NOT MATCHED BY TARGET THEN
    INSERT (NodeId, ParentNodeId, Name, Description, [Order], CreatedAt, IsDeleted)
    VALUES (source.NodeId, NULL, source.Name, source.Description, source.SortOrder, @Now, 0);

DECLARE @RoadmapNodes TABLE (
    RoadmapNodeId uniqueidentifier PRIMARY KEY,
    NodeId uniqueidentifier NOT NULL,
    ParentRoadmapNodeId uniqueidentifier NULL,
    SortOrder int NOT NULL,
    NodeType nvarchar(100) NOT NULL,
    RequirementType nvarchar(100) NOT NULL,
    PositionX int NULL,
    PositionY int NULL
);

INSERT INTO @RoadmapNodes (RoadmapNodeId, NodeId, ParentRoadmapNodeId, SortOrder, NodeType, RequirementType, PositionX, PositionY)
VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NULL, 1, N'Group', N'Required', 540, 80),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 1, N'Topic', N'Required', 180, 40),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 2, N'Topic', N'Required', 900, 40),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 3, N'Topic', N'Recommended', 900, 130),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', NULL, 2, N'Group', N'Required', 260, 250),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000005', 1, N'Topic', N'Recommended', 80, 210),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000005', 2, N'Topic', N'Recommended', 80, 300),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000005', 3, N'Topic', N'Optional', 80, 390),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', NULL, 3, N'Group', N'Required', 540, 340),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000009', 1, N'Topic', N'Required', 830, 270),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000009', 2, N'Topic', N'Required', 830, 360),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000009', 3, N'Topic', N'Required', 830, 450),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000013', NULL, 4, N'Group', N'Required', 300, 560),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000013', 1, N'Topic', N'Required', 80, 520),
('40000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000013', 2, N'Topic', N'Recommended', 80, 610),
('40000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000013', 3, N'Topic', N'Recommended', 80, 700),
('40000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000017', NULL, 5, N'Group', N'Required', 540, 650),
('40000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000017', 1, N'Topic', N'Required', 830, 600),
('40000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000019', '40000000-0000-0000-0000-000000000017', 2, N'Topic', N'Required', 830, 690),
('40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000020', NULL, 6, N'Group', N'Required', 540, 870),
('40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000020', 1, N'Topic', N'Required', 830, 830),
('40000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000020', 2, N'Topic', N'Recommended', 830, 920),
('40000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000023', NULL, 7, N'Group', N'Required', 300, 1020),
('40000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000024', '40000000-0000-0000-0000-000000000023', 1, N'Topic', N'Required', 80, 980),
('40000000-0000-0000-0000-000000000025', '30000000-0000-0000-0000-000000000025', '40000000-0000-0000-0000-000000000023', 2, N'Topic', N'Recommended', 80, 1070),
('40000000-0000-0000-0000-000000000026', '30000000-0000-0000-0000-000000000026', NULL, 8, N'Group', N'Required', 540, 1180),
('40000000-0000-0000-0000-000000000027', '30000000-0000-0000-0000-000000000027', '40000000-0000-0000-0000-000000000026', 1, N'Topic', N'Required', 830, 1110),
('40000000-0000-0000-0000-000000000028', '30000000-0000-0000-0000-000000000028', '40000000-0000-0000-0000-000000000026', 2, N'Topic', N'Recommended', 830, 1200),
('40000000-0000-0000-0000-000000000029', '30000000-0000-0000-0000-000000000029', '40000000-0000-0000-0000-000000000026', 3, N'Topic', N'Recommended', 830, 1290),
('40000000-0000-0000-0000-000000000030', '30000000-0000-0000-0000-000000000030', NULL, 9, N'Milestone', N'Optional', 540, 1420);

MERGE RoadmapNodes AS target
USING @RoadmapNodes AS source
ON target.RoadmapNodeId = source.RoadmapNodeId
WHEN MATCHED THEN
    UPDATE SET
        target.CareerRoadmapId = @RoadmapId,
        target.NodeId = source.NodeId,
        target.ParentRoadmapNodeId = NULL,
        target.[Order] = source.SortOrder,
        target.NodeType = source.NodeType,
        target.RequirementType = source.RequirementType,
        target.PositionX = source.PositionX,
        target.PositionY = source.PositionY,
        target.IsDeleted = 0,
        target.UpdatedAt = @Now
WHEN NOT MATCHED BY TARGET THEN
    INSERT (RoadmapNodeId, CareerRoadmapId, NodeId, ParentRoadmapNodeId, [Order], NodeType, RequirementType, PositionX, PositionY, CreatedAt, IsDeleted)
    VALUES (source.RoadmapNodeId, @RoadmapId, source.NodeId, NULL, source.SortOrder, source.NodeType, source.RequirementType, source.PositionX, source.PositionY, @Now, 0);

UPDATE rn
SET rn.ParentRoadmapNodeId = source.ParentRoadmapNodeId,
    rn.UpdatedAt = @Now
FROM RoadmapNodes rn
INNER JOIN @RoadmapNodes source ON source.RoadmapNodeId = rn.RoadmapNodeId;

DECLARE @Edges TABLE (
    EdgeId uniqueidentifier PRIMARY KEY,
    FromRoadmapNodeId uniqueidentifier NOT NULL,
    ToRoadmapNodeId uniqueidentifier NOT NULL,
    EdgeType nvarchar(100) NOT NULL
);

INSERT INTO @Edges (EdgeId, FromRoadmapNodeId, ToRoadmapNodeId, EdgeType)
VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', N'Next'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000009', N'Next'),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000013', N'Next'),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000017', N'DependsOn'),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000020', N'Next'),
('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000020', '40000000-0000-0000-0000-000000000023', N'Next'),
('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000026', N'Next'),
('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000026', '40000000-0000-0000-0000-000000000030', N'Next'),
('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000025', N'Related');

MERGE RoadmapNodeEdges AS target
USING @Edges AS source
ON target.RoadmapNodeEdgeId = source.EdgeId
WHEN MATCHED THEN
    UPDATE SET
        target.CareerRoadmapId = @RoadmapId,
        target.FromRoadmapNodeId = source.FromRoadmapNodeId,
        target.ToRoadmapNodeId = source.ToRoadmapNodeId,
        target.EdgeType = source.EdgeType,
        target.IsDeleted = 0,
        target.UpdatedAt = @Now
WHEN NOT MATCHED BY TARGET THEN
    INSERT (RoadmapNodeEdgeId, CareerRoadmapId, FromRoadmapNodeId, ToRoadmapNodeId, EdgeType, CreatedAt, IsDeleted)
    VALUES (source.EdgeId, @RoadmapId, source.FromRoadmapNodeId, source.ToRoadmapNodeId, source.EdgeType, @Now, 0);

DECLARE @Resources TABLE (
    ResourceId uniqueidentifier PRIMARY KEY,
    NodeId uniqueidentifier NOT NULL,
    Name nvarchar(255) NOT NULL,
    ResourceUrl nvarchar(max) NOT NULL,
    ResourceType nvarchar(100) NOT NULL,
    Provider nvarchar(255) NULL,
    IsFree bit NOT NULL
);

INSERT INTO @Resources (ResourceId, NodeId, Name, ResourceUrl, ResourceType, Provider, IsFree)
VALUES
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', N'Software Architecture Guide', N'https://roadmap.sh/software-architect', N'Guide', N'roadmap.sh', 1),
('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', N'Martin Fowler on Software Architecture', N'https://martinfowler.com/architecture/', N'Article', N'Martin Fowler', 1),
('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', N'Microsoft Architecture Guide', N'https://learn.microsoft.com/azure/architecture/guide/', N'Guide', N'Microsoft Learn', 1),
('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', N'Architecture Styles', N'https://learn.microsoft.com/azure/architecture/guide/architecture-styles/', N'Documentation', N'Microsoft Learn', 1),
('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', N'Backend Developer Roadmap', N'https://roadmap.sh/backend', N'Guide', N'roadmap.sh', 1),
('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', N'.NET Documentation', N'https://learn.microsoft.com/dotnet/', N'Documentation', N'Microsoft Learn', 1),
('60000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', N'MDN JavaScript Guide', N'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', N'Documentation', N'MDN', 1),
('60000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', N'Spring Guides', N'https://spring.io/guides', N'Guide', N'Spring', 1),
('60000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', N'Missing Semester', N'https://missing.csail.mit.edu/', N'Course', N'MIT CSAIL', 1),
('60000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', N'GitHub Git Documentation', N'https://docs.github.com/en/get-started/using-git/about-git', N'Documentation', N'GitHub', 1),
('60000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011', N'Architecture Decision Records', N'https://adr.github.io/', N'Guide', N'ADR GitHub', 1),
('60000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000012', N'Google Technical Writing Courses', N'https://developers.google.com/tech-writing', N'Course', N'Google Developers', 1),
('60000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000013', N'Design Patterns Catalog', N'https://refactoring.guru/design-patterns', N'Guide', N'Refactoring Guru', 1),
('60000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000014', N'Architectural Principles', N'https://learn.microsoft.com/dotnet/architecture/modern-web-apps-azure/architectural-principles', N'Documentation', N'Microsoft Learn', 1),
('60000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000015', N'Domain-Driven Design Reference', N'https://martinfowler.com/tags/domain%20driven%20design.html', N'Article', N'Martin Fowler', 1),
('60000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000016', N'Microservices Resource Guide', N'https://microservices.io/', N'Guide', N'microservices.io', 1),
('60000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000017', N'OWASP ASVS', N'https://owasp.org/www-project-application-security-verification-standard/', N'Standard', N'OWASP', 1),
('60000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000018', N'OpenID Connect', N'https://openid.net/developers/how-connect-works/', N'Documentation', N'OpenID Foundation', 1),
('60000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000019', N'OWASP API Security Top 10', N'https://owasp.org/API-Security/editions/2023/en/0x11-t10/', N'Guide', N'OWASP', 1),
('60000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000020', N'Designing Data-Intensive Applications', N'https://dataintensive.net/', N'Book', N'Martin Kleppmann', 0),
('60000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000021', N'SQL Server Query Performance', N'https://learn.microsoft.com/sql/relational-databases/performance/performance-monitoring-and-tuning-tools', N'Documentation', N'Microsoft Learn', 1),
('60000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000022', N'NoSQL Explained', N'https://www.mongodb.com/resources/basics/databases/nosql-explained', N'Article', N'MongoDB', 1),
('60000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000023', N'Azure Integration Architecture', N'https://learn.microsoft.com/azure/architecture/integration/', N'Documentation', N'Microsoft Learn', 1),
('60000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000024', N'GraphQL Best Practices', N'https://graphql.org/learn/best-practices/', N'Documentation', N'GraphQL', 1),
('60000000-0000-0000-0000-000000000025', '30000000-0000-0000-0000-000000000025', N'RabbitMQ Tutorials', N'https://www.rabbitmq.com/tutorials', N'Tutorial', N'RabbitMQ', 1),
('60000000-0000-0000-0000-000000000026', '30000000-0000-0000-0000-000000000026', N'Google SRE Book', N'https://sre.google/sre-book/table-of-contents/', N'Book', N'Google SRE', 1),
('60000000-0000-0000-0000-000000000027', '30000000-0000-0000-0000-000000000027', N'GitHub Actions Documentation', N'https://docs.github.com/actions', N'Documentation', N'GitHub', 1),
('60000000-0000-0000-0000-000000000028', '30000000-0000-0000-0000-000000000028', N'Docker Get Started', N'https://docs.docker.com/get-started/', N'Documentation', N'Docker', 1),
('60000000-0000-0000-0000-000000000029', '30000000-0000-0000-0000-000000000029', N'Azure Architecture Center', N'https://learn.microsoft.com/azure/architecture/', N'Documentation', N'Microsoft Learn', 1),
('60000000-0000-0000-0000-000000000030', '30000000-0000-0000-0000-000000000030', N'Dynamics 365 Documentation', N'https://learn.microsoft.com/dynamics365/', N'Documentation', N'Microsoft Learn', 1);

IF EXISTS (
    SELECT 1
    FROM @Nodes n
    WHERE NOT EXISTS (
        SELECT 1
        FROM @Resources r
        WHERE r.NodeId = n.NodeId
          AND (r.ResourceUrl LIKE N'https://%' OR r.ResourceUrl LIKE N'http://%')
    )
)
BEGIN
    THROW 51000, 'Every generated node must have at least one learning resource with a real http(s) URL.', 1;
END;

MERGE LearningResources AS target
USING @Resources AS source
ON target.LearningResourceId = source.ResourceId
WHEN MATCHED THEN
    UPDATE SET
        target.NodeId = source.NodeId,
        target.Name = source.Name,
        target.ResourceUrl = source.ResourceUrl,
        target.ResourceType = source.ResourceType,
        target.Provider = source.Provider,
        target.IsFree = source.IsFree,
        target.IsDeleted = 0,
        target.UpdatedAt = @Now
WHEN NOT MATCHED BY TARGET THEN
    INSERT (LearningResourceId, NodeId, Name, ResourceUrl, ResourceType, Provider, IsFree, CreatedAt, IsDeleted)
    VALUES (source.ResourceId, source.NodeId, source.Name, source.ResourceUrl, source.ResourceType, source.Provider, source.IsFree, @Now, 0);

SELECT
    @RoleId AS CareerRoleId,
    @RoadmapId AS CareerRoadmapId,
    (SELECT COUNT(*) FROM RoadmapNodes WHERE CareerRoadmapId = @RoadmapId AND IsDeleted = 0) AS RoadmapNodeCount,
    (SELECT COUNT(*) FROM RoadmapNodeEdges WHERE CareerRoadmapId = @RoadmapId AND IsDeleted = 0) AS EdgeCount,
    (SELECT COUNT(*) FROM LearningResources WHERE NodeId IN (SELECT NodeId FROM @Nodes) AND IsDeleted = 0) AS ResourceCount;
