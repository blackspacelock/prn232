using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalRoadmapIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "PersonalRoadmaps",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "PersonalRoadmaps");
        }
    }
}
