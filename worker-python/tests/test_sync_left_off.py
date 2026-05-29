import importlib.util
import stat
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = PROJECT_ROOT / "scripts" / "sync_left_off.py"

spec = importlib.util.spec_from_file_location("sync_left_off", SCRIPT_PATH)
sync_left_off = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_left_off)


class SyncLeftOffTests(unittest.TestCase):
    def test_resolves_default_paths(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            env = {
                "PATH_PROJECT_RESOURCES": temp_dir,
            }

            self.assertEqual(
                sync_left_off.resolve_source_path(env),
                Path("/home/nick/NickVault/LEFT-OFF.md"),
            )
            self.assertEqual(
                sync_left_off.resolve_destination_path(env),
                Path(temp_dir) / "services-data" / "LEFT-OFF.md",
            )

    def test_resolves_non_secret_overrides(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "vault" / "LEFT-OFF.md"
            destination_path = Path(temp_dir) / "worker" / "LEFT-OFF.md"
            env = {
                "PATH_PROJECT_RESOURCES": str(Path(temp_dir) / "resources"),
                "PATH_LEFT_OFF_NICKVAULT_SOURCE": str(source_path),
                "PATH_LEFT_OFF_DESTINATION": str(destination_path),
            }

            self.assertEqual(sync_left_off.resolve_source_path(env), source_path)
            self.assertEqual(sync_left_off.resolve_destination_path(env), destination_path)

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
