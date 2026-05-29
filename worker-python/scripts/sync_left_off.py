"""Copy the NickVault LEFT-OFF markdown file into worker service data."""

import logging
import os
import shutil
import stat
from pathlib import Path

from dotenv import load_dotenv


WORKER_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_PATH = Path("/home/nick/NickVault/LEFT-OFF.md")
DEFAULT_MODE = 0o640

ENV_SOURCE_PATH = "PATH_LEFT_OFF_NICKVAULT_SOURCE"
ENV_WORKER_SOURCE_PATH = "PATH_LEFT_OFF_SOURCE"
ENV_DESTINATION_PATH = "PATH_LEFT_OFF_DESTINATION"
ENV_PROJECT_RESOURCES = "PATH_PROJECT_RESOURCES"

logger = logging.getLogger("sync_left_off")


def _mode(path):
    return stat.S_IMODE(path.stat().st_mode)


def _stat_summary(path):
    stats = path.stat()
    return {
        "path": str(path),
        "size": stats.st_size,
        "mtime": int(stats.st_mtime),
        "mode": oct(_mode(path)),
    }


def _log_stats(label, path):
    stats = _stat_summary(path)
    logger.info(
        "%s mode=%s path=%s size=%s mtime=%s",
        label,
        stats["mode"],
        stats["path"],
        stats["size"],
        stats["mtime"],
    )


def _path_from_env(env, key):
    value = env.get(key)
    return Path(value).expanduser() if value else None


def resolve_source_path(env=None):
    """Resolve the source LEFT-OFF.md path without reading file contents."""
    env = os.environ if env is None else env
    return _path_from_env(env, ENV_SOURCE_PATH) or DEFAULT_SOURCE_PATH


def resolve_destination_path(env=None):
    """Resolve the worker input path for LEFT-OFF.md."""
    env = os.environ if env is None else env
    explicit_destination = _path_from_env(env, ENV_DESTINATION_PATH)
    if explicit_destination:
        return explicit_destination

    worker_source = _path_from_env(env, ENV_WORKER_SOURCE_PATH)
    if worker_source:
        return worker_source

    project_resources = _path_from_env(env, ENV_PROJECT_RESOURCES)
    if not project_resources:
        raise ValueError(f"{ENV_PROJECT_RESOURCES} not set in environment")

    return project_resources / "services-data" / "LEFT-OFF.md"


def copy_left_off(source_path, destination_path, mode=DEFAULT_MODE):
    """Copy source markdown to destination and apply the expected file mode."""
    source_path = Path(source_path).expanduser()
    destination_path = Path(destination_path).expanduser()

    if not source_path.is_file():
        raise FileNotFoundError(f"LEFT-OFF source file not found: {source_path}")

    _log_stats("source", source_path)
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source_path, destination_path)

    try:
        destination_path.chmod(mode)
    except OSError as exc:
        logger.warning("could not set destination mode=%s: %s", oct(mode), exc)

    _log_stats("destination", destination_path)
    return destination_path


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
    load_dotenv(WORKER_ROOT / ".env")

    source_path = resolve_source_path()
    destination_path = resolve_destination_path()
    copy_left_off(source_path, destination_path)


if __name__ == "__main__":
    main()
