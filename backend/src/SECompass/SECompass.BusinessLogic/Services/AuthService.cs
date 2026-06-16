using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Auth;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.Enums;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IConfiguration _config;

    public AuthService(IUnitOfWork uow, IMapper mapper, IConfiguration config)
    {
        _uow = uow;
        _mapper = mapper;
        _config = config;
    }

    public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterUserDto dto)
    {
        if (await _uow.Users.ExistsAsync(u => u.Email == dto.Email))
            return ServiceResult<AuthResponseDto>.Fail("Email already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHashed = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.RoadmapUser,
            IsActive = true
        };
        await _uow.Users.AddAsync(user);

        var profile = new DataAccess.Entities.Profile
        {
            UserId = user.Id
        };
        await _uow.Profiles.AddAsync(profile);
        await _uow.SaveChangesAsync();

        var (accessToken, refreshToken) = await GenerateAndStoreTokensAsync(user);
        return ServiceResult<AuthResponseDto>.Ok(BuildAuthResponse(user, accessToken, refreshToken));
    }

    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginUserDto dto)
    {
        var users = await _uow.Users.FindAsync(u => u.Email == dto.Email);
        var user = users.FirstOrDefault();
        if (user == null || user.PasswordHashed == null)
            return ServiceResult<AuthResponseDto>.Fail("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHashed))
            return ServiceResult<AuthResponseDto>.Fail("Invalid credentials.");

        if (!user.IsActive)
            return ServiceResult<AuthResponseDto>.Fail("Account is deactivated.");

        var (accessToken, refreshToken) = await GenerateAndStoreTokensAsync(user);
        return ServiceResult<AuthResponseDto>.Ok(BuildAuthResponse(user, accessToken, refreshToken));
    }

    public async Task<ServiceResult<AuthResponseDto>> GoogleLoginAsync(GoogleLoginDto dto)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _config["Google:ClientId"] }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
        }
        catch (Exception ex)
        {
            return ServiceResult<AuthResponseDto>.Fail($"Invalid Google token: {ex.Message}");
        }

        var users = await _uow.Users.FindAsync(u => u.GoogleId == payload.Subject);
        var user = users.FirstOrDefault();

        if (user == null)
        {
            var byEmail = await _uow.Users.FindAsync(u => u.Email == payload.Email);
            user = byEmail.FirstOrDefault();

            if (user != null)
            {
                user.GoogleId = payload.Subject;
                user.AvatarUrl = payload.Picture;
                _uow.Users.Update(user);
            }
            else
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = payload.Name,
                    Email = payload.Email,
                    PasswordHashed = null,
                    GoogleId = payload.Subject,
                    AvatarUrl = payload.Picture,
                    Role = UserRole.RoadmapUser,
                    IsActive = true
                };
                await _uow.Users.AddAsync(user);

                var profile = new DataAccess.Entities.Profile { UserId = user.Id };
                await _uow.Profiles.AddAsync(profile);
            }
            await _uow.SaveChangesAsync();
        }

        var (accessToken, refreshToken) = await GenerateAndStoreTokensAsync(user);
        return ServiceResult<AuthResponseDto>.Ok(BuildAuthResponse(user, accessToken, refreshToken));
    }

    public async Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto)
    {
        var tokens = await _uow.UserRefreshTokens.FindAsync(t => t.Token == dto.RefreshToken);
        var token = tokens.FirstOrDefault();

        if (token == null || token.IsRevoked || token.ExpiresAt <= DateTime.Now)
            return ServiceResult<AuthResponseDto>.Fail("Invalid or expired refresh token.");

        token.IsRevoked = true;
        token.RevokedAt = DateTime.Now;
        _uow.UserRefreshTokens.Update(token);

        var users = await _uow.Users.FindAsync(u => u.Id == token.UserId);
        var user = users.FirstOrDefault();
        if (user == null) return ServiceResult<AuthResponseDto>.Fail("User not found.");

        var (accessToken, refreshToken) = await GenerateAndStoreTokensAsync(user);
        await _uow.SaveChangesAsync();
        return ServiceResult<AuthResponseDto>.Ok(BuildAuthResponse(user, accessToken, refreshToken));
    }

    public async Task<ServiceResult<bool>> LogoutAsync(RefreshTokenRequestDto dto)
    {
        var tokens = await _uow.UserRefreshTokens.FindAsync(t => t.Token == dto.RefreshToken);
        var token = tokens.FirstOrDefault();
        if (token == null) return ServiceResult<bool>.Fail("Token not found.");

        token.IsRevoked = true;
        token.RevokedAt = DateTime.Now;
        _uow.UserRefreshTokens.Update(token);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    private string GenerateJwtToken(User user)
    {
        var secret = _config["Jwt:Secret"]!;
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];
        var expiryMinutes = int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "15");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, ((int)user.Role).ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("FullName", user.FullName)
        };

        var token = new JwtSecurityToken(issuer, audience, claims,
            expires: DateTime.Now.AddMinutes(expiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<(string accessToken, string refreshToken)> GenerateAndStoreTokensAsync(User user)
    {
        var accessToken = GenerateJwtToken(user);
        var refreshTokenValue = GenerateRefreshTokenValue();
        var expiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");

        var refreshTokenEntity = new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.Now.AddDays(expiryDays),
            IsRevoked = false
        };
        await _uow.UserRefreshTokens.AddAsync(refreshTokenEntity);
        await _uow.SaveChangesAsync();

        return (accessToken, refreshTokenValue);
    }

    private static string GenerateRefreshTokenValue()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    private static AuthResponseDto BuildAuthResponse(User user, string accessToken, string refreshToken)
        => new()
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = (int)user.Role,
            AvatarUrl = user.AvatarUrl
        };
}
