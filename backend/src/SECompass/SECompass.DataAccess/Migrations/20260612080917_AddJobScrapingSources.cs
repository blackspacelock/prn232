using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddJobScrapingSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobScrapingSources",
                columns: table => new
                {
                    JobScrapingSourceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Region = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Enabled = table.Column<bool>(type: "bit", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    JobCardXPath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TitleXPath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TagsXPath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    MaxPostings = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobScrapingSources", x => x.JobScrapingSourceId);
                });

            migrationBuilder.InsertData(
                table: "JobScrapingSettings",
                columns: new[] { "JobScrapingSettingId", "CreatedAt", "DayOfWeek", "Enabled", "Frequency", "LastRunAt", "TimeOfDay", "UpdatedAt" },
                values: new object[] { new Guid("99999999-9999-9999-9999-999999999999"), new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), "Sunday", true, "Weekly", null, "00:00:00", null });

            migrationBuilder.InsertData(
                table: "JobScrapingSources",
                columns: new[] { "JobScrapingSourceId", "CreatedAt", "Enabled", "JobCardXPath", "MaxPostings", "Name", "Region", "TagsXPath", "TitleXPath", "UpdatedAt", "Url" },
                values: new object[,]
                {
                    { new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), true, "//li[contains(@class,'job-item')]", 40, "CareerLink", "Vietnam", ".//a[contains(@class,'job-position')]", ".//h5[contains(@class,'job-name')]", null, "https://www.careerlink.vn/viec-lam/cntt-phan-mem/19" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), true, "//li[contains(@class,'jobs-search')] | //div[contains(@class,'job-search-card')]", 40, "LinkedIn", "Global", ".//*[contains(@class,'metadata')] | .//*[contains(@class,'subtitle')]", ".//h3 | .//*[contains(@class,'title')]", null, "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software%20engineer&location=Vietnam&start=0" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobScrapingSources");

            migrationBuilder.DeleteData(
                table: "JobScrapingSettings",
                keyColumn: "JobScrapingSettingId",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"));
        }
    }
}
