namespace SECompass.BusinessLogic.DTOs.User;

public class AdminUpdateUserDto : UpdateUserDto
{
    public int? Role { get; set; }
    public bool? IsActive { get; set; }
}
