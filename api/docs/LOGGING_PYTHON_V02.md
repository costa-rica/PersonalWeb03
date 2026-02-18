# Python Logging Requirements for News Nexus Applications (V02)

## Overview

This document specifies logging requirements for all Python applications in the News Nexus ecosystem using the [loguru](https://github.com/Delgan/loguru) package. The configuration ensures consistent, production-ready logging across Flask apps, FastAPI apps, and standalone Python scripts.

## Environment Variables

### Required Variables

| Variable          | Description                                                      | Example                   |
| ----------------- | ---------------------------------------------------------------- | ------------------------- |
| `NAME_APP`        | Application name used in log filenames                           | `NewsNexusPythonQueuer01` |
| `RUN_ENVIRONMENT` | Environment mode (`development`, `testing`, or `production`)     | `production`              |
| `PATH_TO_LOGS`    | Directory path for log file storage (testing & production only)  | `/var/log/newsnexus`      |

### Optional Variables

| Variable        | Default    | Description                                    |
| --------------- | ---------- | ---------------------------------------------- |
| `LOG_MAX_SIZE`  | `10485760` | Maximum log file size in bytes (10 MB default) |
| `LOG_MAX_FILES` | `10`       | Maximum number of rotated log files to retain  |

## Log File Naming Convention

**Format**: `{NAME_APP}.log`

**Rotation**: `{NAME_APP}.{number}.log` (e.g., `NewsNexusPythonQueuer01.1.log`, `NewsNexusPythonQueuer01.2.log`)

**Full Path Example**: `/var/log/newsnexus/NewsNexusPythonQueuer01.log`

## Configuration Requirements

### Development Environment (`RUN_ENVIRONMENT=development`)

- **Output**: Console/terminal (stdout/stderr) with colorized output
- **Level**: `DEBUG` (all log levels)
- **Format**: Simplified format optimized for readability
- **Rotation**: Not applicable
- **Use Case**: Local development, debugging, interactive testing

### Testing Environment (`RUN_ENVIRONMENT=testing`)

- **Output**: File-based logging in `PATH_TO_LOGS` directory
- **Level**: `DEBUG` (all log levels)
- **Rotation**: Size-based rotation using `LOG_MAX_SIZE` and `LOG_MAX_FILES`
- **Format**: Structured format with timestamp, level, module, and message
- **Process Safety**: Enable `enqueue=True` for thread/process-safe logging
- **Child Process Handling**: Environment Injection - each process writes to its own log file
- **Use Case**: Automated testing, CI/CD pipelines, pre-production validation

### Production Environment (`RUN_ENVIRONMENT=production`)

- **Output**: File-based logging in `PATH_TO_LOGS` directory
- **Level**: `ERROR` (only ERROR and CRITICAL messages)
- **Rotation**: Size-based rotation using `LOG_MAX_SIZE` and `LOG_MAX_FILES`
- **Format**: Structured format with timestamp, level, module, and message
- **Process Safety**: Enable `enqueue=True` for thread/process-safe logging
- **Child Process Handling**: Environment Injection - each process writes to its own log file
- **Use Case**: Production deployment, minimal logging overhead

## Loguru Configuration

### Base Configuration Function

```python
import os
import sys
from loguru import logger

def configure_logging():
    """
    Configure loguru based on environment variables.
    Should be called once at application startup.

    Raises:
        ValueError: If required environment variables are missing or invalid
    """
    # Remove default handler
    logger.remove()

    # Validate NAME_APP is set and not empty
    app_name = os.getenv('NAME_APP')
    if not app_name or app_name.strip() == '':
        raise ValueError(
            "NAME_APP environment variable is required and must not be empty. "
            "This ensures each process writes to its own unique log file. "
            "If spawning child processes, inject NAME_APP into the child's environment."
        )

    RUN_ENVIRONMENT = os.getenv('RUN_ENVIRONMENT', 'development')

    if RUN_ENVIRONMENT == 'development':
        # Development: Console logging with colors and all log levels
        logger.add(
            sys.stderr,
            format="<green>{time:HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
            level="DEBUG",
            colorize=True
        )
        logger.info(f"Logging configured for {RUN_ENVIRONMENT} environment (console output, DEBUG level)")

    elif RUN_ENVIRONMENT == 'testing':
        # Testing: File-based logging with all log levels (mirrors production structure)
        log_path = os.getenv('PATH_TO_LOGS')
        log_max_size = int(os.getenv('LOG_MAX_SIZE', '10485760'))  # 10 MB default
        log_max_files = int(os.getenv('LOG_MAX_FILES', '10'))

        if not log_path:
            raise ValueError("PATH_TO_LOGS environment variable is required in testing environment")

        # Ensure log directory exists
        os.makedirs(log_path, exist_ok=True)

        log_file = os.path.join(log_path, f"{app_name}.log")

        logger.add(
            log_file,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
            level="DEBUG",  # All log levels for testing
            rotation=log_max_size,  # Rotate when file reaches max size
            retention=log_max_files,  # Keep max number of old logs
            compression="zip",  # Compress rotated logs
            enqueue=True,  # Thread/process-safe logging via queue
            backtrace=True,  # Enable exception tracing
            diagnose=True  # Enable variable values in exceptions
        )
        logger.info(f"Logging configured for {RUN_ENVIRONMENT} environment (file: {log_file}, DEBUG level)")

    elif RUN_ENVIRONMENT == 'production':
        # Production: File-based logging with ERROR level only
        log_path = os.getenv('PATH_TO_LOGS')
        log_max_size = int(os.getenv('LOG_MAX_SIZE', '10485760'))  # 10 MB default
        log_max_files = int(os.getenv('LOG_MAX_FILES', '10'))

        if not log_path:
            raise ValueError("PATH_TO_LOGS environment variable is required in production environment")

        # Ensure log directory exists
        os.makedirs(log_path, exist_ok=True)

        log_file = os.path.join(log_path, f"{app_name}.log")

        logger.add(
            log_file,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
            level="ERROR",  # Only ERROR and CRITICAL in production
            rotation=log_max_size,  # Rotate when file reaches max size
            retention=log_max_files,  # Keep max number of old logs
            compression="zip",  # Compress rotated logs
            enqueue=True,  # Thread/process-safe logging via queue
            backtrace=True,  # Enable exception tracing
            diagnose=True  # Enable variable values in exceptions
        )
        logger.error(f"Logging configured for {RUN_ENVIRONMENT} environment (file: {log_file}, ERROR level)")

    else:
        # Unknown environment - default to development behavior with warning
        logger.add(
            sys.stderr,
            format="<green>{time:HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
            level="DEBUG",
            colorize=True
        )
        logger.warning(f"Unknown RUN_ENVIRONMENT '{RUN_ENVIRONMENT}' - defaulting to development mode")

    return logger
```

## Framework-Specific Integration

### Flask Applications

```python
from flask import Flask
from loguru import logger
import logging

def create_app():
    app = Flask(__name__)

    # Configure loguru
    configure_logging()

    # Intercept Flask's default logger
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            # Get corresponding Loguru level if it exists
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno

            # Find caller from where originated the logged message
            frame, depth = logging.currentframe(), 2
            while frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1

            logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

    # Replace Flask's logger handlers
    app.logger.handlers = [InterceptHandler()]
    app.logger.setLevel(logging.DEBUG)  # Let loguru filter by level

    # Also intercept werkzeug logger (Flask's server)
    logging.getLogger('werkzeug').handlers = [InterceptHandler()]
    logging.getLogger('werkzeug').setLevel(logging.DEBUG)  # Let loguru filter by level

    return app
```

### FastAPI Applications

```python
from fastapi import FastAPI
from loguru import logger
import logging

def create_app():
    app = FastAPI()

    # Configure loguru
    configure_logging()

    # Intercept uvicorn loggers
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno

            frame, depth = logging.currentframe(), 2
            while frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1

            logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

    # Replace uvicorn and fastapi loggers
    logging.getLogger("uvicorn").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    logging.getLogger("fastapi").handlers = [InterceptHandler()]

    # Set to DEBUG to allow loguru to filter by level
    logging.getLogger("uvicorn").setLevel(logging.DEBUG)
    logging.getLogger("uvicorn.access").setLevel(logging.DEBUG)
    logging.getLogger("fastapi").setLevel(logging.DEBUG)

    return app
```

### Standalone Python Scripts

```python
#!/usr/bin/env python3
from loguru import logger
from configure_logging import configure_logging  # Import from shared module

def main():
    # Configure logging at script start
    configure_logging()

    logger.info("Script started")

    try:
        # Your script logic here
        logger.debug("Processing data...")
        # ...
    except Exception as e:
        logger.exception("Script failed with error")
        raise
    finally:
        logger.info("Script completed")

if __name__ == "__main__":
    main()
```

## Parent/Child Process Logging

### Environment Injection Strategy

All processes (parent and child) must write to their own unique log files. When spawning a child process, the parent **must inject** a unique `NAME_APP` into the child's environment variables. This ensures the child's call to `configure_logging()` generates a distinct log file rather than attempting to write to the parent's file.

**Key Principles:**

1. Each microservice/process has its own log file identified by `NAME_APP`
2. Multiple instances of the same microservice can safely write to the same log file (loguru's `enqueue=True` handles concurrent writes)
3. Parent processes inject `NAME_APP` when spawning child processes
4. If `NAME_APP` is missing or empty, `configure_logging()` will raise an error to alert engineers
5. Child processes inherit `RUN_ENVIRONMENT` from parent unless explicitly overridden

### Log File Separation

Example log file distribution:

- `NewsNexusPythonQueuer01.log` - Flask queuer service (parent)
- `NewsNexusDeduper02.log` - Deduper microservice (child process)
- `NewsNexusClassifierLocationScorer01.log` - Location scorer microservice (child process)

Multiple deduper jobs spawned simultaneously will all write to `NewsNexusDeduper02.log` safely.

### Implementation: Spawning Child Processes

When spawning child processes via `subprocess`, inject the child's `NAME_APP` into its environment:

```python
import subprocess
import os
from loguru import logger

def run_deduper_job(job_id):
    """Spawn deduper microservice with its own NAME_APP."""
    logger.info(f"Starting deduper job {job_id}")

    # Get deduper path from environment
    deduper_path = os.getenv('PATH_TO_MICROSERVICE_DEDUPER')
    python_venv = os.getenv('PATH_TO_PYTHON_VENV')

    # Build command
    cmd = [
        f"{python_venv}/bin/python",
        f"{deduper_path}/src/main.py",
        "analyze_fast"
    ]

    # CRITICAL: Inject child process NAME_APP
    # Copy parent's environment and override NAME_APP
    child_env = os.environ.copy()
    child_env['NAME_APP'] = 'NAME_CHILD_PROCESS'  # Replace with actual child process name

    # Spawn process with injected environment
    process = subprocess.Popen(
        cmd,
        env=child_env,  # Use modified environment
        text=True
    )

    # Wait for completion
    exit_code = process.wait()
    logger.info(f"Deduper job {job_id} completed with exit code {exit_code}")

    return exit_code
```

**Important:** Replace `'NAME_CHILD_PROCESS'` with the actual child process name. For example:

- For deduper: `child_env['NAME_APP'] = 'NewsNexusDeduper02'`
- For location scorer: `child_env['NAME_APP'] = 'NewsNexusClassifierLocationScorer01'`

### Real-World Example

```python
import subprocess
import os
from loguru import logger

def spawn_microservice(microservice_name, script_path, args=None):
    """
    Generic function to spawn microservices with proper NAME_APP injection.

    Args:
        microservice_name: Name for the child process (e.g., 'NewsNexusDeduper02')
        script_path: Path to the microservice script
        args: Optional list of command-line arguments
    """
    python_venv = os.getenv('PATH_TO_PYTHON_VENV')

    cmd = [f"{python_venv}/bin/python", script_path]
    if args:
        cmd.extend(args)

    # Inject NAME_APP for the child process
    child_env = os.environ.copy()
    child_env['NAME_APP'] = microservice_name

    logger.info(f"Spawning {microservice_name} with command: {' '.join(cmd)}")

    process = subprocess.Popen(cmd, env=child_env, text=True)
    return process

# Usage
deduper_path = os.getenv('PATH_TO_MICROSERVICE_DEDUPER')
process = spawn_microservice(
    microservice_name='NewsNexusDeduper02',
    script_path=f"{deduper_path}/src/main.py",
    args=['analyze_fast', '--report-id', '12345']
)
```

### Error Handling

If a child process is spawned **without** `NAME_APP` being injected, or if `NAME_APP` is empty, the child's `configure_logging()` will fail with a clear error message:

```
ValueError: NAME_APP environment variable is required and must not be empty.
This ensures each process writes to its own unique log file.
If spawning child processes, inject NAME_APP into the child's environment.
```

This intentional failure ensures engineers are alerted to properly configure the child process environment.

## Implementation Checklist

- [ ] Install loguru: `pip install loguru`
- [ ] Add required environment variables to `.env` (`NAME_APP`, `RUN_ENVIRONMENT`, `PATH_TO_LOGS`, `LOG_MAX_SIZE`, `LOG_MAX_FILES`)
- [ ] Set `RUN_ENVIRONMENT` to `development`, `testing`, or `production`
- [ ] Create shared `logging_config.py` module with `configure_logging()` function
- [ ] Update Flask apps to integrate loguru with InterceptHandler
- [ ] Update FastAPI apps to integrate loguru with InterceptHandler
- [ ] Update standalone scripts to call `configure_logging()`
- [ ] Update subprocess spawning code to inject `NAME_APP` for child processes
- [ ] Verify each microservice has its own unique `NAME_APP` configured
- [ ] Test that missing/empty `NAME_APP` raises clear error message
- [ ] Test development mode uses console logging with all log levels
- [ ] Test testing mode writes all log levels to files with rotation
- [ ] Test production mode writes only ERROR and CRITICAL to files
- [ ] Test log rotation by generating logs exceeding `LOG_MAX_SIZE`
- [ ] Verify log files are created in `PATH_TO_LOGS` directory with correct names
- [ ] Verify multiple instances of same microservice can write to same log file
- [ ] Ensure PM2 can read logs (check file permissions)

## Log Levels

Use appropriate log levels following these guidelines:

| Level      | Usage                                                       | Development | Testing | Production |
| ---------- | ----------------------------------------------------------- | ----------- | ------- | ---------- |
| `DEBUG`    | Detailed debugging information                              | ✓           | ✓       | ✗          |
| `INFO`     | General informational messages (requests, job status, etc.) | ✓           | ✓       | ✗          |
| `WARNING`  | Warning messages (deprecated features, recoverable errors)  | ✓           | ✓       | ✗          |
| `ERROR`    | Error messages (exceptions, failed operations)              | ✓           | ✓       | ✓          |
| `CRITICAL` | Critical errors (service failures, data corruption)         | ✓           | ✓       | ✓          |

## Example Log Output

### Development Format (Console)

```
14:23:45.123 | DEBUG    | src.routes.deduper:process_data:23 | Validating input parameters
14:23:45.456 | INFO     | src.routes.deduper:create_job:45 | Creating deduper job for report ID 12345
14:23:45.789 | INFO     | src.routes.deduper:create_job:67 | Job 42 enqueued successfully
14:23:46.012 | WARNING  | src.utils.cache:get_cached:89 | Cache miss for key 'report_12345'
14:24:12.345 | ERROR    | src.routes.deduper:check_job_status:156 | Job 42 failed with exit code 1
```

### Testing Format (File - All Levels)

```
2025-12-29 14:23:45.123 | DEBUG    | src.routes.deduper:process_data:23 | Validating input parameters
2025-12-29 14:23:45.456 | INFO     | src.routes.deduper:create_job:45 | Creating deduper job for report ID 12345
2025-12-29 14:23:45.789 | INFO     | src.routes.deduper:create_job:67 | Job 42 enqueued successfully
2025-12-29 14:23:46.012 | WARNING  | src.utils.cache:get_cached:89 | Cache miss for key 'report_12345'
2025-12-29 14:24:12.345 | ERROR    | src.routes.deduper:check_job_status:156 | Job 42 failed with exit code 1
```

### Production Format (File - Errors Only)

```
2025-12-29 14:24:12.345 | ERROR    | src.routes.deduper:check_job_status:156 | Job 42 failed with exit code 1
2025-12-29 14:25:03.678 | CRITICAL | src.database.connection:reconnect:234 | Database connection lost after 3 retry attempts
```

## Environment Comparison

| Feature           | Development       | Testing                  | Production               |
| ----------------- | ----------------- | ------------------------ | ------------------------ |
| Output Target     | Console (stderr)  | File                     | File                     |
| Log Level         | DEBUG (all)       | DEBUG (all)              | ERROR (errors only)      |
| Colorized Output  | Yes               | No                       | No                       |
| File Rotation     | N/A               | Yes                      | Yes                      |
| File Compression  | N/A               | Yes (zip)                | Yes (zip)                |
| Process Safety    | N/A               | Yes (enqueue=True)       | Yes (enqueue=True)       |
| PATH_TO_LOGS Req. | No                | Yes                      | Yes                      |
| Use Case          | Local development | Automated testing, CI/CD | Production deployment    |

## References

- [Loguru Documentation](https://loguru.readthedocs.io/)
- [Loguru GitHub](https://github.com/Delgan/loguru)
- [Best Practices for Python Logging](https://loguru.readthedocs.io/en/stable/resources/recipes.html)

## Migration Notes

### Migrating from Standard Logging to Loguru

When migrating from Python's standard `logging` module to loguru:

1. Replace `import logging` with `from loguru import logger`
2. Replace `logging.getLogger(__name__)` with direct `logger` usage
3. Replace `logger.info()` calls (no changes needed - same API)
4. Remove logging configuration code (formatters, handlers, etc.)
5. Add `configure_logging()` call at application startup
6. Test thoroughly in development before deploying to testing/production

### Migrating from LOGGING_PYTHON.md (V01) to V02

When migrating from the previous logging specification:

1. Update `RUN_ENVIRONMENT` values:
   - Keep `development` for local development
   - Use `testing` for CI/CD and pre-production environments (was previously non-production)
   - Keep `production` for production deployments
2. Update `configure_logging()` function to handle three environments instead of two
3. Be aware: production now logs **only ERROR and CRITICAL** (previously logged INFO+)
4. Update `.env` files across all environments to use the correct `RUN_ENVIRONMENT` value
5. Test each environment mode thoroughly:
   - Development: Verify console output with all log levels
   - Testing: Verify file output with all log levels
   - Production: Verify file output with only errors
6. Update deployment scripts and documentation to reflect new environment modes

## Support

For questions or issues with logging configuration:

- Review this document
- Check [Loguru documentation](https://loguru.readthedocs.io/)
- Test configuration in development environment first
- Verify environment variables are set correctly
