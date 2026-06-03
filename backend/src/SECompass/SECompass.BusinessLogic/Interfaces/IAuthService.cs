using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.Auth;

namespace SECompass.BusinessLogic.Interfaces;

public interface IAuthService
{
    Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterUserDto dto);
    Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginUserDto dto);
    Task<ServiceResult<AuthResponseDto>> GoogleLoginAsync(GoogleLoginDto dto);
    Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto);
    Task<ServiceResult<bool>> LogoutAsync(RefreshTokenRequestDto dto);
}
