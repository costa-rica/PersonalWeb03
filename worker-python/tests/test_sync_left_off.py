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
SCRIPT_PATH = PROJECT_ROOT / "scripts" / "sync_left_off.py"

if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

spec = importlib.util.spec_from_file_location("sync_left_off", SCRIPT_PATH)
sync_left_off = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_left_off)

from utils.config import Config


class SyncLeftOffTests(unittest.TestCase):
    def test_resolves_default_paths(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            logbook_path = Path(temp_dir) / "vault" / "logbook.md"
            legacy_path = Path(temp_dir) / "vault" / "LEFT-OFF.md"
            env = {
                "PATH_PROJECT_RESOURCES": temp_dir,
            }

            with (
                patch.object(sync_left_off, "DEFAULT_LOGBOOK_SOURCE_PATH", logbook_path),
                patch.object(sync_left_off, "DEFAULT_LEGACY_SOURCE_PATH", legacy_path),
            ):
                self.assertEqual(sync_left_off.resolve_source_path(env), logbook_path)

            self.assertEqual(
                sync_left_off.resolve_destination_path(env),
                Path(temp_dir) / "services-data" / "LEFT-OFF.md",
            )

    def test_prefers_default_logbook_source_when_both_files_exist(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            logbook_path = Path(temp_dir) / "vault" / "logbook.md"
            legacy_path = Path(temp_dir) / "vault" / "LEFT-OFF.md"
            logbook_path.parent.mkdir()
            logbook_path.write_text("# 20260530\n", encoding="utf-8")
            legacy_path.write_text("# 20260529\n", encoding="utf-8")

            with (
                patch.object(sync_left_off, "DEFAULT_LOGBOOK_SOURCE_PATH", logbook_path),
                patch.object(sync_left_off, "DEFAULT_LEGACY_SOURCE_PATH", legacy_path),
            ):
                self.assertEqual(sync_left_off.resolve_source_path({}), logbook_path)

    def test_falls_back_to_legacy_default_source_only_for_nickvault_source(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            logbook_path = Path(temp_dir) / "vault" / "logbook.md"
            legacy_path = Path(temp_dir) / "vault" / "LEFT-OFF.md"
            legacy_path.parent.mkdir()
            legacy_path.write_text("# 20260529\n", encoding="utf-8")
            env = {
                "PATH_PROJECT_RESOURCES": str(Path(temp_dir) / "resources"),
            }

            with (
                patch.object(sync_left_off, "DEFAULT_LOGBOOK_SOURCE_PATH", logbook_path),
                patch.object(sync_left_off, "DEFAULT_LEGACY_SOURCE_PATH", legacy_path),
            ):
                self.assertEqual(sync_left_off.resolve_source_path(env), legacy_path)

            self.assertEqual(
                sync_left_off.resolve_destination_path(env),
                Path(temp_dir) / "resources" / "services-data" / "LEFT-OFF.md",
            )

    def test_resolves_non_secret_overrides(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "vault" / "logbook.md"
            destination_path = Path(temp_dir) / "worker" / "LEFT-OFF.md"
            env = {
                "PATH_PROJECT_RESOURCES": str(Path(temp_dir) / "resources"),
                "PATH_LEFT_OFF_NICKVAULT_SOURCE": str(source_path),
                "PATH_LEFT_OFF_DESTINATION": str(destination_path),
            }

            self.assertEqual(sync_left_off.resolve_source_path(env), source_path)
            self.assertEqual(sync_left_off.resolve_destination_path(env), destination_path)

    def test_default_destination_matches_worker_source_default(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            env = {
                "PATH_PROJECT_RESOURCES": temp_dir,
            }

            with patch.dict(os.environ, env, clear=True), patch("utils.config.load_dotenv"):
                config = Config()

            self.assertEqual(
                sync_left_off.resolve_destination_path(env),
                config.get_left_off_source_path(),
            )

    def test_worker_source_override_can_drive_destination(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            worker_source_path = Path(temp_dir) / "services-data" / "LEFT-OFF.md"
            env = {
                "PATH_PROJECT_RESOURCES": str(Path(temp_dir) / "resources"),
                "PATH_LEFT_OFF_SOURCE": str(worker_source_path),
            }

            self.assertEqual(sync_left_off.resolve_destination_path(env), worker_source_path)

    def test_copy_preserves_content_creates_parent_and_sets_mode(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "vault" / "LEFT-OFF.md"
            destination_path = Path(temp_dir) / "resources" / "services-data" / "LEFT-OFF.md"
            content = "# 20260528\n\n## LEFT-OFF\n- [ ] private task text\n"
            source_path.parent.mkdir()
            source_path.write_text(content, encoding="utf-8")

            with self.assertLogs("sync_left_off", level="INFO") as captured_logs:
                result = sync_left_off.copy_left_off(source_path, destination_path)

            self.assertEqual(result, destination_path)
            self.assertEqual(destination_path.read_text(encoding="utf-8"), content)
            self.assertEqual(stat.S_IMODE(destination_path.stat().st_mode), 0o640)
            self.assertIn("source mode=", "\n".join(captured_logs.output))
            self.assertIn("destination mode=0o640", "\n".join(captured_logs.output))
            self.assertNotIn("private task text", "\n".join(captured_logs.output))


if __name__ == "__main__":
    unittest.main()
