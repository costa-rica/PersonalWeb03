import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"

if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))


from services.left_off.summarizer import Summarizer


class SummarizerPromptTests(unittest.TestCase):
    def test_build_prompt_includes_toggl_csv_when_available(self):
        template = (
            "Activities:\n<< last-7-days-activities.md >>\n"
            "Toggl:\n<< project_time_entries.csv >>"
        )

        prompt = Summarizer._build_prompt(
            template,
            "Worked on Project Alpha",
            "project_name,hours_worked\nProject Alpha,3.5"
        )

        self.assertIn("Worked on Project Alpha", prompt)
        self.assertIn("project_name,hours_worked", prompt)
        self.assertIn("Project Alpha,3.5", prompt)

    def test_build_prompt_uses_fallback_when_toggl_csv_missing(self):
        template = (
            "Activities:\n<< last-7-days-activities.md >>\n"
            "Toggl:\n<< project_time_entries.csv >>"
        )

        prompt = Summarizer._build_prompt(template, "Worked on Project Alpha")

        self.assertIn("Worked on Project Alpha", prompt)
        self.assertIn("Toggl data unavailable for this run.", prompt)

    def test_read_toggl_csv_content_returns_none_when_file_missing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            missing_path = Path(temp_dir) / "missing.csv"
            self.assertIsNone(Summarizer._read_toggl_csv_content(missing_path))

    def test_read_toggl_csv_content_reads_existing_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_path = Path(temp_dir) / "project_time_entries.csv"
            csv_path.write_text("project_name,hours_worked\nProject Alpha,3.5", encoding="utf-8")

            content = Summarizer._read_toggl_csv_content(csv_path)

            self.assertEqual(content, "project_name,hours_worked\nProject Alpha,3.5")


if __name__ == "__main__":
    unittest.main()
