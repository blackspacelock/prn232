using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddRoadmapTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RoadmapTags",
                columns: table => new
                {
                    RoadmapTagId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PersonalRoadmapId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoadmapTags", x => x.RoadmapTagId);
                    table.ForeignKey(
                        name: "FK_RoadmapTags_PersonalRoadmaps_PersonalRoadmapId",
                        column: x => x.PersonalRoadmapId,
                        principalTable: "PersonalRoadmaps",
                        principalColumn: "PersonalRoadmapId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapTags_PersonalRoadmapId_Name",
                table: "RoadmapTags",
                columns: new[] { "PersonalRoadmapId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoadmapTags");
        }
    }
}
