"""
Logging configuration for PersonalWeb03-Services using loguru.

This module configures loguru based on environment variables following
the standard logging approach defined in docs/LOGGING_PYTHON.md.
"""

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

    run_environment = os.getenv('RUN_ENVIRONMENT', 'development')

    if run_environment == 'production':
        # Production: File-based logging with rotation
        log_path = os.getenv('PATH_TO_LOGS')
        log_max_size = int(os.getenv('LOG_MAX_SIZE', '10485760'))  # 10 MB default
        log_max_files = int(os.getenv('LOG_MAX_FILES', '10'))

        if not log_path:
            raise ValueError("PATH_TO_LOGS environment variable is required in production")

        # Ensure log directory exists
        os.makedirs(log_path, exist_ok=True)

        log_file = os.path.join(log_path, f"{app_name}.log")

        logger.add(
            log_file,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
            level="INFO",
            rotation=log_max_size,  # Rotate when file reaches max size
            retention=log_max_files,  # Keep max number of old logs
            compression="zip",  # Compress rotated logs
            enqueue=True,  # Thread/process-safe logging via queue
            backtrace=True,  # Enable exception tracing
            diagnose=True  # Enable variable values in exceptions
        )
    else:
        # Development: Console logging with colors
        logger.add(
            sys.stderr,
            format="<green>{time:HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
            level="DEBUG",
            colorize=True
        )

    logger.info(f"Logging configured for {run_environment} environment")

    return logger
