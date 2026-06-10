using System.Linq.Expressions;
using SECompass.DataAccess.Entities;

namespace SECompass.DataAccess.Repositories;

public interface IRepository<T> where T : BaseAuditableEntity
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    void Update(T entity);
    void Delete(T entity, bool physicalDelete = false);
}
