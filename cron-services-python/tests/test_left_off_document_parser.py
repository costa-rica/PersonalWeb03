import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"

if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))


from services.left_off.document_parser import LeftOffMarkdownParser


class LeftOffMarkdownParserTests(unittest.TestCase):
    def _write_markdown(self, directory, content):
        markdown_path = Path(directory) / "LEFT-OFF.md"
        markdown_path.write_text(content, encoding="utf-8")
        return markdown_path

    def _read_output(self, directory):
        return (Path(directory) / "last-7-days-activities.md").read_text(encoding="utf-8")

    def test_extracts_only_the_last_7_days(self):
        content = """# 20260322

## LEFT-OFF
- [ ] Latest item

# 20260321

## LEFT-OFF
- [ ] Keep this too

# 20260314

## LEFT-OFF
- [ ] This should be excluded
"""
        with tempfile.TemporaryDirectory() as temp_dir:
            markdown_path = self._write_markdown(temp_dir, content)
            output_path = Path(temp_dir) / "last-7-days-activities.md"
            parser = LeftOffMarkdownParser(
                markdown_path,
                now_provider=lambda: datetime(2026, 3, 22, 9, 30, 0),
            )

            self.assertTrue(parser.load_document())
            self.assertTrue(parser.extract_last_7_days(output_path))

            extracted = self._read_output(temp_dir)
            self.assertIn("# 20260322", extracted)
            self.assertIn("# 20260321", extracted)
            self.assertNotIn("# 20260314", extracted)
            self.assertNotIn("This should be excluded", extracted)

    def test_extracts_entire_file_when_no_cutoff_is_found(self):
        content = """# 20260322

## LEFT-OFF
- [ ] Only recent notes

# 20260320

## LEFT-OFF
- [ ] Still within the window
"""
        with tempfile.TemporaryDirectory() as temp_dir:
            markdown_path = self._write_markdown(temp_dir, content)
            output_path = Path(temp_dir) / "last-7-days-activities.md"
            parser = LeftOffMarkdownParser(
                markdown_path,
                now_provider=lambda: datetime(2026, 3, 22, 9, 30, 0),
            )

            self.assertTrue(parser.load_document())
            self.assertTrue(parser.extract_last_7_days(output_path))
            self.assertEqual(self._read_output(temp_dir), content)

    def test_preserves_markdown_content(self):
        content = """# 20260322

## LEFT-OFF
- [ ] Open to choses a faire faster
- [ ] Daily note files pre-structured
`inline code`

```
const status = "todo";
```
Plain text summary.
"""
        with tempfile.TemporaryDirectory() as temp_dir:
            markdown_path = self._write_markdown(temp_dir, content)
            output_path = Path(temp_dir) / "last-7-days-activities.md"
            parser = LeftOffMarkdownParser(
                markdown_path,
                now_provider=lambda: datetime(2026, 3, 22, 9, 30, 0),
            )

            self.assertTrue(parser.load_document())
            self.assertTrue(parser.extract_last_7_days(output_path))

            extracted = self._read_output(temp_dir)
            self.assertIn("- [ ] Open to choses a faire faster", extracted)
            self.assertIn("`inline code`", extracted)
            self.assertIn('const status = "todo";', extracted)
            self.assertIn("Plain text summary.", extracted)

    def test_fails_when_no_valid_date_headings_exist(self):
        content = """# LEFT-OFF

## Notes
- [ ] This heading is not a date
"""
        with tempfile.TemporaryDirectory() as temp_dir:
            markdown_path = self._write_markdown(temp_dir, content)
            output_path = Path(temp_dir) / "last-7-days-activities.md"
            parser = LeftOffMarkdownParser(
                markdown_path,
                now_provider=lambda: datetime(2026, 3, 22, 9, 30, 0),
            )

            self.assertTrue(parser.load_document())
            self.assertFalse(parser.extract_last_7_days(output_path))
            self.assertFalse(output_path.exists())


if __name__ == "__main__":
    unittest.main()
