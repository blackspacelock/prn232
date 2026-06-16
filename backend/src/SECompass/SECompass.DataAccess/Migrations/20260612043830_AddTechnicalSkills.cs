using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddTechnicalSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Skills");

            migrationBuilder.CreateTable(
                name: "TechnicalSkills",
                columns: table => new
                {
                    TechnicalSkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicalSkills", x => x.TechnicalSkillId);
                });

            migrationBuilder.CreateTable(
                name: "NodeTechnicalSkills",
                columns: table => new
                {
                    NodeTechnicalSkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TechnicalSkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NodeTechnicalSkills", x => x.NodeTechnicalSkillId);
                    table.ForeignKey(
                        name: "FK_NodeTechnicalSkills_Nodes_NodeId",
                        column: x => x.NodeId,
                        principalTable: "Nodes",
                        principalColumn: "NodeId");
                    table.ForeignKey(
                        name: "FK_NodeTechnicalSkills_TechnicalSkills_TechnicalSkillId",
                        column: x => x.TechnicalSkillId,
                        principalTable: "TechnicalSkills",
                        principalColumn: "TechnicalSkillId");
                });

            migrationBuilder.CreateTable(
                name: "ProfileTechnicalSkills",
                columns: table => new
                {
                    ProfileTechnicalSkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TechnicalSkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfileTechnicalSkills", x => x.ProfileTechnicalSkillId);
                    table.ForeignKey(
                        name: "FK_ProfileTechnicalSkills_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_ProfileTechnicalSkills_TechnicalSkills_TechnicalSkillId",
                        column: x => x.TechnicalSkillId,
                        principalTable: "TechnicalSkills",
                        principalColumn: "TechnicalSkillId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_NodeTechnicalSkills_NodeId_TechnicalSkillId",
                table: "NodeTechnicalSkills",
                columns: new[] { "NodeId", "TechnicalSkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NodeTechnicalSkills_TechnicalSkillId",
                table: "NodeTechnicalSkills",
                column: "TechnicalSkillId");

            migrationBuilder.CreateIndex(
                name: "IX_ProfileTechnicalSkills_ProfileId_TechnicalSkillId",
                table: "ProfileTechnicalSkills",
                columns: new[] { "ProfileId", "TechnicalSkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProfileTechnicalSkills_TechnicalSkillId",
                table: "ProfileTechnicalSkills",
                column: "TechnicalSkillId");

            migrationBuilder.CreateIndex(
                name: "IX_TechnicalSkills_Name",
                table: "TechnicalSkills",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NodeTechnicalSkills");

            migrationBuilder.DropTable(
                name: "ProfileTechnicalSkills");

            migrationBuilder.DropTable(
                name: "TechnicalSkills");

            migrationBuilder.CreateTable(
                name: "Skills",
                columns: table => new
                {
                    SkillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SkillName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => x.SkillId);
                    table.ForeignKey(
                        name: "FK_Skills_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Skills_ProfileId",
                table: "Skills",
                column: "ProfileId");
        }
    }
}
