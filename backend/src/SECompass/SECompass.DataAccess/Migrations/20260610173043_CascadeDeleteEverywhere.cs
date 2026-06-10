using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class CascadeDeleteEverywhere : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes");

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
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes",
                column: "ParentRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                table: "RoadmapNodeEdges");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes");

            migrationBuilder.AddForeignKey(
                name: "FK_NodeProgresses_RoadmapNodes_RoadmapNodeId",
                table: "NodeProgresses",
                column: "RoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Nodes_Nodes_ParentNodeId",
                table: "Nodes",
                column: "ParentNodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PersonalRoadmaps_CareerRoadmaps_CareerRoadmapId",
                table: "PersonalRoadmaps",
                column: "CareerRoadmapId",
                principalTable: "CareerRoadmaps",
                principalColumn: "CareerRoadmapId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "FromRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "ToRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes",
                column: "ParentRoadmapNodeId",
                principalTable: "RoadmapNodes",
                principalColumn: "RoadmapNodeId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
