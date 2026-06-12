using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SoftDeleteClientCascade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CareerRoadmaps_CareerRoles_CareerRoleId",
                table: "CareerRoadmaps");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_ChatSessions_ChatSessionId",
                table: "ChatMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatSessions_Profiles_ProfileId",
                table: "ChatSessions");

            migrationBuilder.DropForeignKey(
                name: "FK_GitHubRepositories_Profiles_ProfileId",
                table: "GitHubRepositories");

            migrationBuilder.DropForeignKey(
                name: "FK_LearningResources_Nodes_NodeId",
                table: "LearningResources");

            migrationBuilder.DropForeignKey(
                name: "FK_NodeProgresses_PersonalRoadmaps_PersonalRoadmapId",
                table: "NodeProgresses");

            migrationBuilder.DropForeignKey(
                name: "FK_NodeProgresses_RoadmapNodes_RoadmapNodeId",
                table: "NodeProgresses");

            migrationBuilder.DropForeignKey(
                name: "FK_Nodes_Nodes_ParentNodeId",
                table: "Nodes");

            migrationBuilder.DropForeignKey(
                name: "FK_PersonalRoadmaps_CareerRoadmaps_CareerRoadmapId",
                table: "PersonalRoadmaps");

            migrationBuilder.DropForeignKey(
                name: "FK_PersonalRoadmaps_Profiles_ProfileId",
                table: "PersonalRoadmaps");

            migrationBuilder.DropForeignKey(
                name: "FK_Profiles_Users_UserId",
                table: "Profiles");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodes");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_Nodes_NodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropForeignKey(
                name: "FK_Skills_Profiles_ProfileId",
                table: "Skills");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRefreshTokens_Users_UserId",
                table: "UserRefreshTokens");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerRoadmaps_CareerRoles_CareerRoleId",
                table: "CareerRoadmaps",
                column: "CareerRoleId",
                principalTable: "CareerRoles",
                principalColumn: "CareerRoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_ChatSessions_ChatSessionId",
                table: "ChatMessages",
                column: "ChatSessionId",
                principalTable: "ChatSessions",
                principalColumn: "ChatSessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatSessions_Profiles_ProfileId",
                table: "ChatSessions",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_GitHubRepositories_Profiles_ProfileId",
                table: "GitHubRepositories",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_LearningResources_Nodes_NodeId",
                table: "LearningResources",
                column: "NodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_NodeProgresses_PersonalRoadmaps_PersonalRoadmapId",
                table: "NodeProgresses",
                column: "PersonalRoadmapId",
                principalTable: "PersonalRoadmaps",
                principalColumn: "PersonalRoadmapId");

            migrationBuilder.AddForeignKey(
                name: "FK_NodeProgresses_RoadmapNodes_RoadmapNodeId",
                table: "NodeProgresses",
                column: "RoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Nodes_Nodes_ParentNodeId",
                table: "Nodes",
                column: "ParentNodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_PersonalRoadmaps_CareerRoadmaps_CareerRoadmapId",
                table: "PersonalRoadmaps",
                column: "CareerRoadmapId",
                principalTable: "CareerRoadmaps",
                principalColumn: "CareerRoadmapId");

            migrationBuilder.AddForeignKey(
                name: "FK_PersonalRoadmaps_Profiles_ProfileId",
                table: "PersonalRoadmaps",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Profiles_Users_UserId",
                table: "Profiles",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodeEdges",
                column: "CareerRoadmapId",
                principalTable: "CareerRoadmaps",
                principalColumn: "CareerRoadmapId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "FromRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "ToRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodes_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodes",
                column: "CareerRoadmapId",
                principalTable: "CareerRoadmaps",
                principalColumn: "CareerRoadmapId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodes_Nodes_NodeId",
                table: "RoadmapNodes",
                column: "NodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes",
                column: "ParentRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Skills_Profiles_ProfileId",
                table: "Skills",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserRefreshTokens_Users_UserId",
                table: "UserRefreshTokens",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CareerRoadmaps_CareerRoles_CareerRoleId",
                table: "CareerRoadmaps");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_ChatSessions_ChatSessionId",
                table: "ChatMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatSessions_Profiles_ProfileId",
                table: "ChatSessions");

            migrationBuilder.DropForeignKey(
                name: "FK_GitHubRepositories_Profiles_ProfileId",
                table: "GitHubRepositories");

            migrationBuilder.DropForeignKey(
                name: "FK_LearningResources_Nodes_NodeId",
                table: "LearningResources");

            migrationBuilder.DropForeignKey(
                name: "FK_NodeProgresses_PersonalRoadmaps_PersonalRoadmapId",
                table: "NodeProgresses");

            migrationBuilder.DropForeignKey(
                name: "FK_NodeProgresses_RoadmapNodes_RoadmapNodeId",
                table: "NodeProgresses");

            migrationBuilder.DropForeignKey(
                name: "FK_Nodes_Nodes_ParentNodeId",
                table: "Nodes");

            migrationBuilder.DropForeignKey(
                name: "FK_PersonalRoadmaps_CareerRoadmaps_CareerRoadmapId",
                table: "PersonalRoadmaps");

            migrationBuilder.DropForeignKey(
                name: "FK_PersonalRoadmaps_Profiles_ProfileId",
                table: "PersonalRoadmaps");

            migrationBuilder.DropForeignKey(
                name: "FK_Profiles_Users_UserId",
                table: "Profiles");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodes");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_Nodes_NodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropForeignKey(
                name: "FK_Skills_Profiles_ProfileId",
                table: "Skills");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRefreshTokens_Users_UserId",
                table: "UserRefreshTokens");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerRoadmaps_CareerRoles_CareerRoleId",
                table: "CareerRoadmaps",
                column: "CareerRoleId",
                principalTable: "CareerRoles",
                principalColumn: "CareerRoleId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_ChatSessions_ChatSessionId",
                table: "ChatMessages",
                column: "ChatSessionId",
                principalTable: "ChatSessions",
                principalColumn: "ChatSessionId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatSessions_Profiles_ProfileId",
                table: "ChatSessions",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GitHubRepositories_Profiles_ProfileId",
                table: "GitHubRepositories",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LearningResources_Nodes_NodeId",
                table: "LearningResources",
                column: "NodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NodeProgresses_PersonalRoadmaps_PersonalRoadmapId",
                table: "NodeProgresses",
                column: "PersonalRoadmapId",
                principalTable: "PersonalRoadmaps",
                principalColumn: "PersonalRoadmapId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NodeProgresses_RoadmapNodes_RoadmapNodeId",
                table: "NodeProgresses",
                column: "RoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Nodes_Nodes_ParentNodeId",
                table: "Nodes",
                column: "ParentNodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PersonalRoadmaps_CareerRoadmaps_CareerRoadmapId",
                table: "PersonalRoadmaps",
                column: "CareerRoadmapId",
                principalTable: "CareerRoadmaps",
                principalColumn: "CareerRoadmapId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PersonalRoadmaps_Profiles_ProfileId",
                table: "PersonalRoadmaps",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Profiles_Users_UserId",
                table: "Profiles",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodeEdges",
                column: "CareerRoadmapId",
                principalTable: "CareerRoadmaps",
                principalColumn: "CareerRoadmapId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "FromRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "ToRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodes_CareerRoadmaps_CareerRoadmapId",
                table: "RoadmapNodes",
                column: "CareerRoadmapId",
                principalTable: "CareerRoadmaps",
                principalColumn: "CareerRoadmapId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodes_Nodes_NodeId",
                table: "RoadmapNodes",
                column: "NodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes",
                column: "ParentRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Skills_Profiles_ProfileId",
                table: "Skills",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRefreshTokens_Users_UserId",
                table: "UserRefreshTokens",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
