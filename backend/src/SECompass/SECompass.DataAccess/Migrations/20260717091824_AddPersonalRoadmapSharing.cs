using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalRoadmapSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsShared",
                table: "PersonalRoadmaps",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "SharedAt",
                table: "PersonalRoadmaps",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsShared",
                table: "PersonalRoadmaps");

            migrationBuilder.DropColumn(
                name: "SharedAt",
                table: "PersonalRoadmaps");
        }
    }
}
