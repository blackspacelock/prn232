using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SECompass.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AdminSeedAndRemoveItviec : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM [JobScrapingSources]
                WHERE [JobScrapingSourceId] = '11111111-1111-1111-1111-111111111111'
                   OR [Name] = N'ITviec';

                IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [UserId] = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
                   AND NOT EXISTS (SELECT 1 FROM [Users] WHERE [Email] = N'admin@secompass.com')
                BEGIN
                    INSERT INTO [Users] ([UserId], [AvatarUrl], [CreatedAt], [Email], [FullName], [GoogleId], [IsActive], [PasswordHashed], [Role], [UpdatedAt])
                    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, '2026-06-12T00:00:00', N'admin@secompass.com', N'Admin Administrator', NULL, 1, N'$2b$12$x60evDbGMbtCfCLsHPITg.F90EITs5NYkcp/zoKMuwzsZ3TRcqBHK', 0, NULL);
                END

                IF EXISTS (SELECT 1 FROM [Users] WHERE [UserId] = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
                   AND NOT EXISTS (SELECT 1 FROM [Profiles] WHERE [UserId] = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
                BEGIN
                    INSERT INTO [Profiles] ([UserId], [BioDescription], [CreatedAt], [Major], [PhoneNumber], [StudiedYear], [University], [UpdatedAt])
                    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, '2026-06-12T00:00:00', NULL, NULL, NULL, NULL, NULL);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM [Profiles]
                WHERE [UserId] = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

                DELETE FROM [Users]
                WHERE [UserId] = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

                IF NOT EXISTS (SELECT 1 FROM [JobScrapingSources] WHERE [JobScrapingSourceId] = '11111111-1111-1111-1111-111111111111')
                BEGIN
                    INSERT INTO [JobScrapingSources] ([JobScrapingSourceId], [CreatedAt], [Enabled], [JobCardXPath], [MaxPostings], [Name], [Region], [TagsXPath], [TitleXPath], [UpdatedAt], [Url])
                    VALUES ('11111111-1111-1111-1111-111111111111', '2026-06-12T00:00:00', 0, N'//div[contains(@class,''job-card'')]', 40, N'ITviec', N'Vietnam', N'.//div[contains(@class,''tag'')] | .//span[contains(@class,''tag'')]', N'.//h3[contains(@class,''title'')] | .//a[contains(@class,''title'')]', NULL, N'https://itviec.com/it-jobs');
                END
                """);
        }
    }
}
