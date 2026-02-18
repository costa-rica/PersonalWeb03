"""Logging configuration for PersonalWeb03API using loguru."""

import os
import sys
from loguru import logger


def configure_logging():
    """
    Configure loguru based on environment variables.
    Should be called once at application startup.

    Raises:
        SystemExit: If required environment variables are missing or invalid
    """
    # Remove default handler
    logger.remove()

    # Add a temporary stderr sink so fatal errors are visible before full config
    logger.add(sys.stderr, level="ERROR", format="{level}: {message}")

    # Validate NAME_APP
    app_name = os.getenv('NAME_APP')
    if not app_name or app_name.strip() == '':
        logger.critical("Fatal: NAME_APP environment variable is required and must not be empty.")
        sys.exit(1)

    # Validate RUN_ENVIRONMENT
    run_environment = os.getenv('RUN_ENVIRONMENT')
    valid_environments = ('development', 'testing', 'production')
    if not run_environment:
        logger.critical("Fatal: RUN_ENVIRONMENT environment variable is required.")
        sys.exit(1)
    if run_environment not in valid_environments:
        logger.critical(
            f"Fatal: RUN_ENVIRONMENT='{run_environment}' is invalid. "
            f"Must be one of: {', '.join(valid_environments)}"
        )
        sys.exit(1)

    # Remove temporary stderr sink now that validation passed
    logger.remove()

    if run_environment == 'development':
        logger.add(
            sys.stderr,
            format="<green>{time:HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
            level="DEBUG",
            colorize=True,
            backtrace=True,
            diagnose=True
        )

    else:
        # testing or production: both use file logging
        log_path = os.getenv('PATH_TO_LOGS')
        if not log_path:
            # Re-add stderr temporarily to emit the fatal error
            logger.add(sys.stderr, level="CRITICAL", format="{level}: {message}")
            logger.critical(
                f"Fatal: PATH_TO_LOGS environment variable is required in {run_environment}."
            )
            sys.exit(1)

        log_max_size_mb = int(os.getenv('LOG_MAX_SIZE_IN_MB', '3'))
        log_max_files = int(os.getenv('LOG_MAX_FILES', '3'))

        os.makedirs(log_path, exist_ok=True)
        log_file = os.path.join(log_path, f"{app_name}.log")

        file_sink_kwargs = dict(
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
            level="INFO",
            rotation=f"{log_max_size_mb} MB",
            retention=log_max_files,
            compression="zip",
            enqueue=True,
            backtrace=True,
            diagnose=True
        )

        if run_environment == 'testing':
            # Testing: terminal + file
            logger.add(
                sys.stderr,
                format="<green>{time:HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
                level="INFO",
                colorize=True,
                backtrace=True,
                diagnose=True
            )

        logger.add(log_file, **file_sink_kwargs)

    # Install uncaught exception handler
    def handle_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        logger.opt(exception=(exc_type, exc_value, exc_traceback)).critical(
            "Uncaught exception"
        )

    sys.excepthook = handle_exception

    logger.info(f"Logging configured for {run_environment} environment")

    return logger
