using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class RoadmapStructureLayout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NodeProgresses_Nodes_NodeId",
                table: "NodeProgresses");

            migrationBuilder.DropIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId",
                table: "RoadmapNodes");

            migrationBuilder.DropIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId",
                table: "NodeProgresses");

            migrationBuilder.RenameColumn(
                name: "NodeId",
                table: "NodeProgresses",
                newName: "RoadmapNodeId");

            migrationBuilder.RenameIndex(
                name: "IX_NodeProgresses_NodeId",
                table: "NodeProgresses",
                newName: "IX_NodeProgresses_RoadmapNodeId");

            migrationBuilder.AddColumn<string>(
                name: "NodeType",
                table: "RoadmapNodes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "Topic");

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "RoadmapNodes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentRoadmapNodeId",
                table: "RoadmapNodes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PositionX",
                table: "RoadmapNodes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PositionY",
                table: "RoadmapNodes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequirementType",
                table: "RoadmapNodes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "Required");

            migrationBuilder.Sql("""
                INSERT INTO RoadmapNodes (
                    RoadmapNodeId,
                    CareerRoadmapId,
                    NodeId,
                    [Order],
                    NodeType,
                    RequirementType,
                    CreatedAt,
                    IsDeleted)
                SELECT
                    NEWID(),
                    pr.CareerRoadmapId,
                    np.RoadmapNodeId,
                    COALESCE(n.[Order], 0),
                    'Topic',
                    'Required',
                    GETDATE(),
                    CAST(0 AS bit)
                FROM NodeProgresses np
                INNER JOIN PersonalRoadmaps pr ON pr.PersonalRoadmapId = np.PersonalRoadmapId
                INNER JOIN Nodes n ON n.NodeId = np.RoadmapNodeId
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM RoadmapNodes rn
                    WHERE rn.CareerRoadmapId = pr.CareerRoadmapId
                      AND rn.NodeId = np.RoadmapNodeId
                      AND rn.IsDeleted = 0)
                GROUP BY pr.CareerRoadmapId, np.RoadmapNodeId, n.[Order];
                """);

            migrationBuilder.Sql("""
                UPDATE np
                SET RoadmapNodeId = rn.RoadmapNodeId
                FROM NodeProgresses np
                INNER JOIN PersonalRoadmaps pr ON pr.PersonalRoadmapId = np.PersonalRoadmapId
                INNER JOIN RoadmapNodes rn ON rn.CareerRoadmapId = pr.CareerRoadmapId
                    AND rn.NodeId = np.RoadmapNodeId
                    AND rn.IsDeleted = 0;
                """);

            migrationBuilder.CreateTable(
                name: "RoadmapNodeEdges",
                columns: table => new
                {
                    RoadmapNodeEdgeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CareerRoadmapId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromRoadmapNodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ToRoadmapNodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EdgeType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "Next"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoadmapNodeEdges", x => x.RoadmapNodeEdgeId);
                    table.ForeignKey(
                        name: "FK_RoadmapNodeEdges_CareerRoadmaps_CareerRoadmapId",
                        column: x => x.CareerRoadmapId,
                        principalTable: "CareerRoadmaps",
                        principalColumn: "CareerRoadmapId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RoadmapNodeEdges_RoadmapNodes_FromRoadmapNodeId",
                        column: x => x.FromRoadmapNodeId,
                        principalTable: "RoadmapNodes",
                        principalColumn: "RoadmapNodeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoadmapNodeEdges_RoadmapNodes_ToRoadmapNodeId",
                        column: x => x.ToRoadmapNodeId,
                        principalTable: "RoadmapNodes",
                        principalColumn: "RoadmapNodeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId_NodeId",
                table: "RoadmapNodes",
                columns: new[] { "CareerRoadmapId", "NodeId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes",
                column: "ParentRoadmapNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId_RoadmapNodeId",
                table: "NodeProgresses",
                columns: new[] { "PersonalRoadmapId", "RoadmapNodeId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodeEdges_CareerRoadmapId_FromRoadmapNodeId_ToRoadmapNodeId_EdgeType",
                table: "RoadmapNodeEdges",
                columns: new[] { "CareerRoadmapId", "FromRoadmapNodeId", "ToRoadmapNodeId", "EdgeType" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodeEdges_FromRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "FromRoadmapNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodeEdges_ToRoadmapNodeId",
                table: "RoadmapNodeEdges",
                column: "ToRoadmapNodeId");

            migrationBuilder.AddForeignKey(
                name: "FK_NodeProgresses_RoadmapNodes_RoadmapNodeId",
                table: "NodeProgresses",
                column: "RoadmapNodeId",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NodeProgresses_RoadmapNodes_RoadmapNodeId",
                table: "NodeProgresses");

            migrationBuilder.DropForeignKey(
                name: "FK_RoadmapNodes_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropTable(
                name: "RoadmapNodeEdges");

            migrationBuilder.DropIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId_NodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropIndex(
                name: "IX_RoadmapNodes_ParentRoadmapNodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId_RoadmapNodeId",
                table: "NodeProgresses");

            migrationBuilder.DropColumn(
                name: "NodeType",
                table: "RoadmapNodes");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "RoadmapNodes");

            migrationBuilder.DropColumn(
                name: "ParentRoadmapNodeId",
                table: "RoadmapNodes");

            migrationBuilder.DropColumn(
                name: "PositionX",
                table: "RoadmapNodes");

            migrationBuilder.DropColumn(
                name: "PositionY",
                table: "RoadmapNodes");

            migrationBuilder.DropColumn(
                name: "RequirementType",
                table: "RoadmapNodes");

            migrationBuilder.RenameColumn(
                name: "RoadmapNodeId",
                table: "NodeProgresses",
                newName: "NodeId");

            migrationBuilder.RenameIndex(
                name: "IX_NodeProgresses_RoadmapNodeId",
                table: "NodeProgresses",
                newName: "IX_NodeProgresses_NodeId");

            migrationBuilder.Sql("""
                UPDATE np
                SET NodeId = rn.NodeId
                FROM NodeProgresses np
                INNER JOIN RoadmapNodes rn ON rn.RoadmapNodeId = np.NodeId;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapNodes_CareerRoadmapId",
                table: "RoadmapNodes",
                column: "CareerRoadmapId");

            migrationBuilder.CreateIndex(
                name: "IX_NodeProgresses_PersonalRoadmapId",
                table: "NodeProgresses",
                column: "PersonalRoadmapId");

            migrationBuilder.AddForeignKey(
                name: "FK_NodeProgresses_Nodes_NodeId",
                table: "NodeProgresses",
                column: "NodeId",
                principalTable: "Nodes",
                principalColumn: "NodeId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
