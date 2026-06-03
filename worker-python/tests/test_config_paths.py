import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"

if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))


from utils.config import Config


class ConfigPathTests(unittest.TestCase):
    def test_logbook_source_defaults_to_services_data_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            env = {
                "PATH_PROJECT_RESOURCES": temp_dir,
            }

            with patch.dict(os.environ, env, clear=True), patch("utils.config.load_dotenv"):
                config = Config()

            self.assertEqual(
                config.get_logbook_source_path(),
                Path(temp_dir) / "services-data" / "LOGBOOK.md",
            )

    def test_logbook_source_uses_non_secret_override(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            override_path = Path(temp_dir) / "custom" / "LOGBOOK.md"
            env = {
                "PATH_PROJECT_RESOURCES": temp_dir,
                "PATH_LOGBOOK_SOURCE": str(override_path),
            }

            with patch.dict(os.environ, env, clear=True), patch("utils.config.load_dotenv"):
                config = Config()

            self.assertEqual(config.get_logbook_source_path(), override_path)


if __name__ == "__main__":
    unittest.main()
