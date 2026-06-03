using AutoMapper;
using SECompass.BusinessLogic.Common;
using SECompass.BusinessLogic.DTOs.CareerRole;
using SECompass.BusinessLogic.Interfaces;
using SECompass.DataAccess.Entities;
using SECompass.DataAccess.UnitOfWork;

namespace SECompass.BusinessLogic.Services;

public class CareerRoleService : ICareerRoleService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CareerRoleService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ServiceResult<CareerRoleDto>> CreateAsync(CreateCareerRoleDto dto)
    {
        var role = new CareerRole { Id = Guid.NewGuid(), Name = dto.Name, Description = dto.Description };
        await _uow.CareerRoles.AddAsync(role);
        await _uow.SaveChangesAsync();
        return ServiceResult<CareerRoleDto>.Ok(_mapper.Map<CareerRoleDto>(role));
    }

    public async Task<ServiceResult<List<CareerRoleDto>>> GetAllAsync()
    {
        var roles = await _uow.CareerRoles.GetAllAsync();
        return ServiceResult<List<CareerRoleDto>>.Ok(_mapper.Map<List<CareerRoleDto>>(roles));
    }

    public async Task<ServiceResult<CareerRoleDto>> GetByIdAsync(Guid id)
    {
        var role = await _uow.CareerRoles.GetByIdAsync(id);
        if (role == null) return ServiceResult<CareerRoleDto>.Fail("Career role not found.");
        return ServiceResult<CareerRoleDto>.Ok(_mapper.Map<CareerRoleDto>(role));
    }

    public async Task<ServiceResult<CareerRoleDto>> UpdateAsync(Guid id, UpdateCareerRoleDto dto)
    {
        var role = await _uow.CareerRoles.GetByIdAsync(id);
        if (role == null) return ServiceResult<CareerRoleDto>.Fail("Career role not found.");

        if (dto.Name != null) role.Name = dto.Name;
        if (dto.Description != null) role.Description = dto.Description;

        _uow.CareerRoles.Update(role);
        await _uow.SaveChangesAsync();
        return ServiceResult<CareerRoleDto>.Ok(_mapper.Map<CareerRoleDto>(role));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var role = await _uow.CareerRoles.GetByIdAsync(id);
        if (role == null) return ServiceResult<bool>.Fail("Career role not found.");
        _uow.CareerRoles.Delete(role);
        await _uow.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }
}
