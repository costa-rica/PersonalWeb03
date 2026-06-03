import importlib.util
import os
import sys
import stat
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"
SCRIPT_PATH = PROJECT_ROOT / "scripts" / "sync_logbook.py"

if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

spec = importlib.util.spec_from_file_location("sync_logbook", SCRIPT_PATH)
sync_logbook = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_logbook)

from utils.config import Config


class SyncLogbookTests(unittest.TestCase):
    def test_resolves_default_paths(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            logbook_path = Path(temp_dir) / "vault" / "logbook.md"
            env = {
                "PATH_PROJECT_RESOURCES": temp_dir,
            }

            with patch.object(sync_logbook, "DEFAULT_LOGBOOK_SOURCE_PATH", logbook_path):
                self.assertEqual(sync_logbook.resolve_source_path(env), logbook_path)

            self.assertEqual(
                sync_logbook.resolve_destination_path(env),
                Path(temp_dir) / "services-data" / "LOGBOOK.md",
            )

    def test_resolves_non_secret_overrides(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "vault" / "logbook.md"
            destination_path = Path(temp_dir) / "worker" / "LOGBOOK.md"
            env = {
                "PATH_PROJECT_RESOURCES": str(Path(temp_dir) / "resources"),
                "PATH_LOGBOOK_NICKVAULT_SOURCE": str(source_path),
                "PATH_LOGBOOK_DESTINATION": str(destination_path),
            }

            self.assertEqual(sync_logbook.resolve_source_path(env), source_path)
            self.assertEqual(sync_logbook.resolve_destination_path(env), destination_path)

    def test_default_destination_matches_worker_source_default(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            env = {
                "PATH_PROJECT_RESOURCES": temp_dir,
            }

            with patch.dict(os.environ, env, clear=True), patch("utils.config.load_dotenv"):
                config = Config()

            self.assertEqual(
                sync_logbook.resolve_destination_path(env),
                config.get_logbook_source_path(),
            )

    def test_worker_source_override_can_drive_destination(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            worker_source_path = Path(temp_dir) / "services-data" / "LOGBOOK.md"
            env = {
                "PATH_PROJECT_RESOURCES": str(Path(temp_dir) / "resources"),
                "PATH_LOGBOOK_SOURCE": str(worker_source_path),
            }

            self.assertEqual(sync_logbook.resolve_destination_path(env), worker_source_path)

    def test_copy_preserves_content_creates_parent_and_sets_mode(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "vault" / "LOGBOOK.md"
            destination_path = Path(temp_dir) / "resources" / "services-data" / "LOGBOOK.md"
            content = "# 20260528\n\n## LOGBOOK\n- [ ] private task text\n"
            source_path.parent.mkdir()
            source_path.write_text(content, encoding="utf-8")

            with self.assertLogs("sync_logbook", level="INFO") as captured_logs:
                result = sync_logbook.copy_logbook(source_path, destination_path)

            self.assertEqual(result, destination_path)
            self.assertEqual(destination_path.read_text(encoding="utf-8"), content)
            self.assertEqual(stat.S_IMODE(destination_path.stat().st_mode), 0o640)
            self.assertIn("source mode=", "\n".join(captured_logs.output))
            self.assertIn("destination mode=0o640", "\n".join(captured_logs.output))
            self.assertNotIn("private task text", "\n".join(captured_logs.output))


if __name__ == "__main__":
    unittest.main()
