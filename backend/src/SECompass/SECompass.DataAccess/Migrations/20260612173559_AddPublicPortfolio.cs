using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicPortfolio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PublicPortfolios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Headline = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    PublicBio = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    WebsiteUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LinkedInUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ContactEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    CachedPortfolioAnalysisJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastAnalyzedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicPortfolios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublicPortfolios_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PublicPortfolios_ProfileId",
                table: "PublicPortfolios",
                column: "ProfileId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PublicPortfolios");
        }
    }
}
