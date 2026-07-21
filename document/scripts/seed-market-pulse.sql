SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;

DECLARE @Now datetime2 = SYSUTCDATETIME();

DECLARE @JobTrends TABLE (
    JobTrendId uniqueidentifier PRIMARY KEY,
    TechSkill nvarchar(255) NOT NULL,
    Description nvarchar(max) NULL,
    Source nvarchar(255) NULL,
    Region nvarchar(255) NULL,
    TrendScore int NOT NULL,
    SnapshotDate datetime2 NOT NULL
);

INSERT INTO @JobTrends (JobTrendId, TechSkill, Description, Source, Region, TrendScore, SnapshotDate)
VALUES
-- Vietnam market snapshots
('90000000-0000-0000-0000-000000000001', N'React', N'Frontend demand from product teams hiring web engineers.', N'TopDev Vietnam', N'Vietnam', 42, '2026-04-15'),
('90000000-0000-0000-0000-000000000002', N'React', N'Frontend demand from product teams hiring web engineers.', N'TopDev Vietnam', N'Vietnam', 48, '2026-05-15'),
('90000000-0000-0000-0000-000000000003', N'React', N'Frontend demand from product teams hiring web engineers.', N'VietnamWorks', N'Vietnam', 55, '2026-06-15'),
('90000000-0000-0000-0000-000000000004', N'React', N'Frontend demand from product teams hiring web engineers.', N'LinkedIn Jobs', N'Vietnam', 61, '2026-07-15'),
('90000000-0000-0000-0000-000000000005', N'.NET', N'Enterprise backend demand across outsourcing and banking systems.', N'TopDev Vietnam', N'Vietnam', 50, '2026-04-15'),
('90000000-0000-0000-0000-000000000006', N'.NET', N'Enterprise backend demand across outsourcing and banking systems.', N'VietnamWorks', N'Vietnam', 53, '2026-05-15'),
('90000000-0000-0000-0000-000000000007', N'.NET', N'Enterprise backend demand across outsourcing and banking systems.', N'VietnamWorks', N'Vietnam', 55, '2026-06-15'),
('90000000-0000-0000-0000-000000000008', N'.NET', N'Enterprise backend demand across outsourcing and banking systems.', N'LinkedIn Jobs', N'Vietnam', 54, '2026-07-15'),
('90000000-0000-0000-0000-000000000009', N'Java', N'Backend roles for enterprise platforms, fintech, and ecommerce.', N'TopDev Vietnam', N'Vietnam', 46, '2026-04-15'),
('90000000-0000-0000-0000-000000000010', N'Java', N'Backend roles for enterprise platforms, fintech, and ecommerce.', N'VietnamWorks', N'Vietnam', 44, '2026-05-15'),
('90000000-0000-0000-0000-000000000011', N'Java', N'Backend roles for enterprise platforms, fintech, and ecommerce.', N'VietnamWorks', N'Vietnam', 43, '2026-06-15'),
('90000000-0000-0000-0000-000000000012', N'Java', N'Backend roles for enterprise platforms, fintech, and ecommerce.', N'TopDev Vietnam', N'Vietnam', 42, '2026-07-15'),
('90000000-0000-0000-0000-000000000013', N'Node.js', N'Full-stack and API roles using JavaScript/TypeScript runtimes.', N'TopDev Vietnam', N'Vietnam', 36, '2026-04-15'),
('90000000-0000-0000-0000-000000000014', N'Node.js', N'Full-stack and API roles using JavaScript/TypeScript runtimes.', N'VietnamWorks', N'Vietnam', 41, '2026-05-15'),
('90000000-0000-0000-0000-000000000015', N'Node.js', N'Full-stack and API roles using JavaScript/TypeScript runtimes.', N'LinkedIn Jobs', N'Vietnam', 47, '2026-06-15'),
('90000000-0000-0000-0000-000000000016', N'Node.js', N'Full-stack and API roles using JavaScript/TypeScript runtimes.', N'TopDev Vietnam', N'Vietnam', 52, '2026-07-15'),
('90000000-0000-0000-0000-000000000017', N'SQL', N'Database querying and reporting demand for product and BI teams.', N'VietnamWorks', N'Vietnam', 40, '2026-04-15'),
('90000000-0000-0000-0000-000000000018', N'SQL', N'Database querying and reporting demand for product and BI teams.', N'TopDev Vietnam', N'Vietnam', 42, '2026-05-15'),
('90000000-0000-0000-0000-000000000019', N'SQL', N'Database querying and reporting demand for product and BI teams.', N'LinkedIn Jobs', N'Vietnam', 43, '2026-06-15'),
('90000000-0000-0000-0000-000000000020', N'SQL', N'Database querying and reporting demand for product and BI teams.', N'VietnamWorks', N'Vietnam', 45, '2026-07-15'),
('90000000-0000-0000-0000-000000000021', N'AWS', N'Cloud migration and DevOps postings mentioning AWS services.', N'LinkedIn Jobs', N'Vietnam', 25, '2026-04-15'),
('90000000-0000-0000-0000-000000000022', N'AWS', N'Cloud migration and DevOps postings mentioning AWS services.', N'TopDev Vietnam', N'Vietnam', 29, '2026-05-15'),
('90000000-0000-0000-0000-000000000023', N'AWS', N'Cloud migration and DevOps postings mentioning AWS services.', N'VietnamWorks', N'Vietnam', 35, '2026-06-15'),
('90000000-0000-0000-0000-000000000024', N'AWS', N'Cloud migration and DevOps postings mentioning AWS services.', N'LinkedIn Jobs', N'Vietnam', 41, '2026-07-15'),
('90000000-0000-0000-0000-000000000025', N'Python', N'Backend automation, data, and AI-adjacent engineering roles.', N'VietnamWorks', N'Vietnam', 31, '2026-04-15'),
('90000000-0000-0000-0000-000000000026', N'Python', N'Backend automation, data, and AI-adjacent engineering roles.', N'TopDev Vietnam', N'Vietnam', 36, '2026-05-15'),
('90000000-0000-0000-0000-000000000027', N'Python', N'Backend automation, data, and AI-adjacent engineering roles.', N'LinkedIn Jobs', N'Vietnam', 43, '2026-06-15'),
('90000000-0000-0000-0000-000000000028', N'Python', N'Backend automation, data, and AI-adjacent engineering roles.', N'VietnamWorks', N'Vietnam', 49, '2026-07-15'),
('90000000-0000-0000-0000-000000000029', N'Test Automation', N'QA roles shifting from manual testing toward automated regression suites.', N'TopDev Vietnam', N'Vietnam', 28, '2026-04-15'),
('90000000-0000-0000-0000-000000000030', N'Test Automation', N'QA roles shifting from manual testing toward automated regression suites.', N'VietnamWorks', N'Vietnam', 32, '2026-05-15'),
('90000000-0000-0000-0000-000000000031', N'Test Automation', N'QA roles shifting from manual testing toward automated regression suites.', N'LinkedIn Jobs', N'Vietnam', 38, '2026-06-15'),
('90000000-0000-0000-0000-000000000032', N'Test Automation', N'QA roles shifting from manual testing toward automated regression suites.', N'VietnamWorks', N'Vietnam', 44, '2026-07-15'),
('90000000-0000-0000-0000-000000000033', N'Flutter', N'Mobile roles for cross-platform app development.', N'TopDev Vietnam', N'Vietnam', 24, '2026-04-15'),
('90000000-0000-0000-0000-000000000034', N'Flutter', N'Mobile roles for cross-platform app development.', N'VietnamWorks', N'Vietnam', 27, '2026-05-15'),
('90000000-0000-0000-0000-000000000035', N'Flutter', N'Mobile roles for cross-platform app development.', N'TopDev Vietnam', N'Vietnam', 30, '2026-06-15'),
('90000000-0000-0000-0000-000000000036', N'Flutter', N'Mobile roles for cross-platform app development.', N'LinkedIn Jobs', N'Vietnam', 34, '2026-07-15'),

-- Wider/global snapshots for the Global view
('90000000-0000-0000-0000-000000000101', N'AI Engineering', N'Applied LLM and AI product engineering roles.', N'LinkedIn Economic Graph', N'Global', 44, '2026-04-15'),
('90000000-0000-0000-0000-000000000102', N'AI Engineering', N'Applied LLM and AI product engineering roles.', N'Indeed Global', N'Global', 58, '2026-05-15'),
('90000000-0000-0000-0000-000000000103', N'AI Engineering', N'Applied LLM and AI product engineering roles.', N'LinkedIn Economic Graph', N'Global', 71, '2026-06-15'),
('90000000-0000-0000-0000-000000000104', N'AI Engineering', N'Applied LLM and AI product engineering roles.', N'Indeed Global', N'Global', 84, '2026-07-15'),
('90000000-0000-0000-0000-000000000105', N'Python', N'Data, backend, automation, and AI ecosystem demand.', N'Stack Overflow Survey', N'Global', 55, '2026-04-15'),
('90000000-0000-0000-0000-000000000106', N'Python', N'Data, backend, automation, and AI ecosystem demand.', N'GitHub Octoverse', N'Global', 59, '2026-05-15'),
('90000000-0000-0000-0000-000000000107', N'Python', N'Data, backend, automation, and AI ecosystem demand.', N'Indeed Global', N'Global', 64, '2026-06-15'),
('90000000-0000-0000-0000-000000000108', N'Python', N'Data, backend, automation, and AI ecosystem demand.', N'LinkedIn Economic Graph', N'Global', 69, '2026-07-15'),
('90000000-0000-0000-0000-000000000109', N'TypeScript', N'Frontend and full-stack roles standardizing on typed JavaScript.', N'GitHub Octoverse', N'Global', 43, '2026-04-15'),
('90000000-0000-0000-0000-000000000110', N'TypeScript', N'Frontend and full-stack roles standardizing on typed JavaScript.', N'Stack Overflow Survey', N'Global', 49, '2026-05-15'),
('90000000-0000-0000-0000-000000000111', N'TypeScript', N'Frontend and full-stack roles standardizing on typed JavaScript.', N'Indeed Global', N'Global', 58, '2026-06-15'),
('90000000-0000-0000-0000-000000000112', N'TypeScript', N'Frontend and full-stack roles standardizing on typed JavaScript.', N'GitHub Octoverse', N'Global', 66, '2026-07-15'),
('90000000-0000-0000-0000-000000000113', N'Kubernetes', N'Platform engineering, deployment, and infrastructure orchestration.', N'LinkedIn Economic Graph', N'Global', 31, '2026-04-15'),
('90000000-0000-0000-0000-000000000114', N'Kubernetes', N'Platform engineering, deployment, and infrastructure orchestration.', N'Indeed Global', N'Global', 42, '2026-05-15'),
('90000000-0000-0000-0000-000000000115', N'Kubernetes', N'Platform engineering, deployment, and infrastructure orchestration.', N'GitHub Octoverse', N'Global', 51, '2026-06-15'),
('90000000-0000-0000-0000-000000000116', N'Kubernetes', N'Platform engineering, deployment, and infrastructure orchestration.', N'LinkedIn Economic Graph', N'Global', 57, '2026-07-15'),
('90000000-0000-0000-0000-000000000117', N'Data Engineering', N'Pipelines, warehouses, lakehouses, and analytics infrastructure.', N'Indeed Global', N'Global', 36, '2026-04-15'),
('90000000-0000-0000-0000-000000000118', N'Data Engineering', N'Pipelines, warehouses, lakehouses, and analytics infrastructure.', N'LinkedIn Economic Graph', N'Global', 44, '2026-05-15'),
('90000000-0000-0000-0000-000000000119', N'Data Engineering', N'Pipelines, warehouses, lakehouses, and analytics infrastructure.', N'Indeed Global', N'Global', 53, '2026-06-15'),
('90000000-0000-0000-0000-000000000120', N'Data Engineering', N'Pipelines, warehouses, lakehouses, and analytics infrastructure.', N'Stack Overflow Survey', N'Global', 63, '2026-07-15'),
('90000000-0000-0000-0000-000000000121', N'Cybersecurity', N'Security operations, application security, and incident response roles.', N'LinkedIn Economic Graph', N'Global', 47, '2026-04-15'),
('90000000-0000-0000-0000-000000000122', N'Cybersecurity', N'Security operations, application security, and incident response roles.', N'Indeed Global', N'Global', 55, '2026-05-15'),
('90000000-0000-0000-0000-000000000123', N'Cybersecurity', N'Security operations, application security, and incident response roles.', N'LinkedIn Economic Graph', N'Global', 65, '2026-06-15'),
('90000000-0000-0000-0000-000000000124', N'Cybersecurity', N'Security operations, application security, and incident response roles.', N'Indeed Global', N'Global', 75, '2026-07-15'),
('90000000-0000-0000-0000-000000000125', N'Go', N'Cloud services and high-performance backend roles.', N'GitHub Octoverse', N'Global', 25, '2026-04-15'),
('90000000-0000-0000-0000-000000000126', N'Go', N'Cloud services and high-performance backend roles.', N'Indeed Global', N'Global', 30, '2026-05-15'),
('90000000-0000-0000-0000-000000000127', N'Go', N'Cloud services and high-performance backend roles.', N'GitHub Octoverse', N'Global', 38, '2026-06-15'),
('90000000-0000-0000-0000-000000000128', N'Go', N'Cloud services and high-performance backend roles.', N'LinkedIn Economic Graph', N'Global', 46, '2026-07-15'),
('90000000-0000-0000-0000-000000000129', N'Java', N'Enterprise backend and large-scale service development.', N'Stack Overflow Survey', N'Global', 51, '2026-04-15'),
('90000000-0000-0000-0000-000000000130', N'Java', N'Enterprise backend and large-scale service development.', N'Indeed Global', N'Global', 50, '2026-05-15'),
('90000000-0000-0000-0000-000000000131', N'Java', N'Enterprise backend and large-scale service development.', N'LinkedIn Economic Graph', N'Global', 48, '2026-06-15'),
('90000000-0000-0000-0000-000000000132', N'Java', N'Enterprise backend and large-scale service development.', N'Stack Overflow Survey', N'Global', 47, '2026-07-15'),
('90000000-0000-0000-0000-000000000133', N'React', N'Product frontend and design-system implementation roles.', N'GitHub Octoverse', N'Global', 52, '2026-04-15'),
('90000000-0000-0000-0000-000000000134', N'React', N'Product frontend and design-system implementation roles.', N'Stack Overflow Survey', N'Global', 55, '2026-05-15'),
('90000000-0000-0000-0000-000000000135', N'React', N'Product frontend and design-system implementation roles.', N'Indeed Global', N'Global', 57, '2026-06-15'),
('90000000-0000-0000-0000-000000000136', N'React', N'Product frontend and design-system implementation roles.', N'GitHub Octoverse', N'Global', 60, '2026-07-15'),
('90000000-0000-0000-0000-000000000137', N'DevOps', N'CI/CD, release automation, monitoring, and cloud delivery roles.', N'Indeed Global', N'Global', 39, '2026-04-15'),
('90000000-0000-0000-0000-000000000138', N'DevOps', N'CI/CD, release automation, monitoring, and cloud delivery roles.', N'LinkedIn Economic Graph', N'Global', 45, '2026-05-15'),
('90000000-0000-0000-0000-000000000139', N'DevOps', N'CI/CD, release automation, monitoring, and cloud delivery roles.', N'Indeed Global', N'Global', 54, '2026-06-15'),
('90000000-0000-0000-0000-000000000140', N'DevOps', N'CI/CD, release automation, monitoring, and cloud delivery roles.', N'GitHub Octoverse', N'Global', 61, '2026-07-15');

MERGE JobTrends AS target
USING @JobTrends AS source
ON target.JobTrendId = source.JobTrendId
WHEN MATCHED THEN
    UPDATE SET
        target.TechSkill = source.TechSkill,
        target.Description = source.Description,
        target.Source = source.Source,
        target.Region = source.Region,
        target.TrendScore = source.TrendScore,
        target.SnapshotDate = source.SnapshotDate,
        target.UpdatedAt = @Now
WHEN NOT MATCHED BY TARGET THEN
    INSERT (JobTrendId, TechSkill, Description, Source, Region, TrendScore, SnapshotDate, CreatedAt)
    VALUES (source.JobTrendId, source.TechSkill, source.Description, source.Source, source.Region, source.TrendScore, source.SnapshotDate, @Now);

SELECT
    COUNT(*) AS SeededMarketPulseRows,
    COUNT(DISTINCT TechSkill) AS UniqueSkills,
    COUNT(DISTINCT Source) AS Sources,
    MIN(SnapshotDate) AS FirstSnapshot,
    MAX(SnapshotDate) AS LastSnapshot
FROM @JobTrends;
