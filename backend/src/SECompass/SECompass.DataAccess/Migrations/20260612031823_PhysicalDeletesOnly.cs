using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class PhysicalDeletesOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM [UserRefreshTokens] WHERE [IsDeleted] = 1;
                DELETE FROM [Skills] WHERE [IsDeleted] = 1;
                DELETE FROM [GitHubRepositories] WHERE [IsDeleted] = 1;
                DELETE FROM [ChatMessages] WHERE [IsDeleted] = 1;
                DELETE FROM [ChatSessions] WHERE [IsDeleted] = 1;
                DELETE FROM [NodeProgresses] WHERE [IsDeleted] = 1;
                DELETE FROM [PersonalRoadmaps] WHERE [IsDeleted] = 1;
                DELETE FROM [RoadmapNodeEdges] WHERE [IsDeleted] = 1;

                WHILE EXISTS (SELECT 1 FROM [RoadmapNodes] WHERE [IsDeleted] = 1)
                BEGIN
                    DELETE rn
                    FROM [RoadmapNodes] rn
                    WHERE rn.[IsDeleted] = 1
                      AND NOT EXISTS (
                          SELECT 1
                          FROM [RoadmapNodes] child
                          WHERE child.[ParentRoadmapNodeId] = rn.[RoadmapNodeId]
                            AND child.[IsDeleted] = 1);
                END

                DELETE FROM [LearningResources] WHERE [IsDeleted] = 1;

                WHILE EXISTS (SELECT 1 FROM [Nodes] WHERE [IsDeleted] = 1)
                BEGIN
                    DELETE n
                    FROM [Nodes] n
                    WHERE n.[IsDeleted] = 1
                      AND NOT EXISTS (
                          SELECT 1
                          FROM [Nodes] child
                          WHERE child.[ParentNodeId] = n.[NodeId]
                            AND child.[IsDeleted] = 1);
                END

                DELETE FROM [CareerRoadmaps] WHERE [IsDeleted] = 1;
                DELETE FROM [CareerRoles] WHERE [IsDeleted] = 1;
                DELETE FROM [Profiles] WHERE [IsDeleted] = 1;
                DELETE FROM [Users] WHERE [IsDeleted] = 1;
                DELETE FROM [JobTrends] WHERE [IsDeleted] = 1;
                """);

            migrationBuilder.DropIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId_NodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropIndex(
                name: "IX_RoadmapNodeEdges_CareerRoadmapId_FromRoadmapNodeId_ToRoadmapNodeId_EdgeType",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId_RoadmapNodeId",
                table: "NodeProgresses");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "UserRefreshTokens");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "RoadmapNodes");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PersonalRoadmaps");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Nodes");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "NodeProgresses");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "LearningResources");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "JobTrends");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "GitHubRepositories");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ChatSessions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CareerRoles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CareerRoadmaps");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId_NodeId",
                table: "RoadmapNodes",
                columns: new[] { "CareerRoadmapId", "NodeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodeEdges_CareerRoadmapId_FromRoadmapNodeId_ToRoadmapNodeId_EdgeType",
                table: "RoadmapNodeEdges",
                columns: new[] { "CareerRoadmapId", "FromRoadmapNodeId", "ToRoadmapNodeId", "EdgeType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId_RoadmapNodeId",
                table: "NodeProgresses",
                columns: new[] { "PersonalRoadmapId", "RoadmapNodeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId_NodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropIndex(
                name: "IX_RoadmapNodeEdges_CareerRoadmapId_FromRoadmapNodeId_ToRoadmapNodeId_EdgeType",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId_RoadmapNodeId",
                table: "NodeProgresses");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "UserRefreshTokens",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Skills",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "RoadmapNodes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "RoadmapNodeEdges",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Profiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PersonalRoadmaps",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Nodes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "NodeProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "LearningResources",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "JobTrends",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "GitHubRepositories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ChatSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ChatMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CareerRoles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CareerRoadmaps",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId_NodeId",
                table: "RoadmapNodes",
                columns: new[] { "CareerRoadmapId", "NodeId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodeEdges_CareerRoadmapId_FromRoadmapNodeId_ToRoadmapNodeId_EdgeType",
                table: "RoadmapNodeEdges",
                columns: new[] { "CareerRoadmapId", "FromRoadmapNodeId", "ToRoadmapNodeId", "EdgeType" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId_RoadmapNodeId",
                table: "NodeProgresses",
                columns: new[] { "PersonalRoadmapId", "RoadmapNodeId" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }
    }
}
