using Serilog;
using SECompass.API.Extensions;
using SECompass.API.Middleware;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Configuration.Sources.Clear();
    builder.Configuration
        .SetBasePath(builder.Environment.ContentRootPath)
        .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
        .AddEnvironmentVariables();

    builder.Host.UseSerilog((context, services, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration)
                     .ReadFrom.Services(services));

    builder.Services.AddApplicationServices(builder.Configuration);

    static void ValidateRequiredConfig(IConfiguration cfg)
    {
        var required = new[]
        {
            "Jwt:Secret", "Jwt:Issuer", "Jwt:Audience",
            "ConnectionStrings:DefaultConnection"
        };
        var missing = required.Where(k => string.IsNullOrWhiteSpace(cfg[k])).ToList();
        if (missing.Count > 0)
            throw new InvalidOperationException(
                $"Missing required configuration keys: {string.Join(", ", missing)}");
    }
    ValidateRequiredConfig(builder.Configuration);

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseMiddleware<PerformanceMonitoringMiddleware>();

    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "SECompass API v1"));

    app.UseRouting();
    app.UseCors("AllowFrontend");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapGraphQL();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application startup failed.");
}
finally
{
    Log.CloseAndFlush();
}
