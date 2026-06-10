using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.User;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UserService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<UserDto>> GetByIdAsync(Guid userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<UserDto>.Fail("User not found.");
        return ServiceResult<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ServiceResult<UserDto>> UpdateAsync(Guid userId, UpdateUserDto dto)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<UserDto>.Fail("User not found.");

        if (dto.FullName != null) user.FullName = dto.FullName;
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;

        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();
        return ServiceResult<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ServiceResult<bool>> DeactivateAsync(Guid userId, bool physicalDelete = false)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return ServiceResult<bool>.Fail("User not found.");

        if (physicalDelete)
        {
            _uow.Users.Delete(user, physicalDelete: true);
            await _uow.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }

        user.IsActive = false;
        _uow.Users.Update(user);

        var refreshTokens = await _uow.UserRefreshTokens.FindAsync(t => t.UserId == userId && !t.IsRevoked);
        foreach (var token in refreshTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.Now;
            _uow.UserRefreshTokens.Update(token);
        }

        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
