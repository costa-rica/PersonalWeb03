"""
Markdown parser for extracting recent content from LEFT-OFF.md.
"""

import re
import logging
from datetime import datetime, timedelta
from pathlib import Path

try:
    from loguru import logger
except ImportError:  # pragma: no cover - fallback for minimal test environments
    logger = logging.getLogger(__name__)


class LeftOffMarkdownParser:
    """Parser for extracting the last 7 days of activities from LEFT-OFF.md."""

    DATE_HEADING_PATTERN = re.compile(r"^#\s+(\d{8})\s*$")

    def __init__(self, markdown_path, now_provider=None):
        """
        Initialize the markdown parser.

        Args:
            markdown_path: Path to the LEFT-OFF.md file
            now_provider: Optional callable returning the current datetime
        """
        self.markdown_path = Path(markdown_path)
        self.now_provider = now_provider or datetime.now
        self.lines = None

    def load_document(self):
        """
        Load the markdown document.

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info(f"Loading markdown document: {self.markdown_path}")
            self.lines = self.markdown_path.read_text(encoding="utf-8").splitlines()
            logger.info(f"Markdown document loaded successfully ({len(self.lines)} lines)")
            return True
        except Exception as exc:
            logger.error(f"Failed to load markdown document: {exc}")
            return False

    def extract_last_7_days(self, output_path):
        """
        Extract content from the last 7 days and save it as markdown.

        The markdown file is expected to contain top-level headings in
        ``# YYYYMMDD`` format, with the newest date first in the file.

        Args:
            output_path: Path to save the extracted markdown content

        Returns:
            bool: True if successful, False otherwise
        """
        if self.lines is None:
            logger.error("Markdown document not loaded")
            return False

        cutoff_date = self.now_provider() - timedelta(days=8)
        cutoff_date_str = cutoff_date.strftime("%Y%m%d")
        logger.info(f"Extracting content from last 7 days (cutoff: {cutoff_date_str})")

        cutoff_index = None
        found_date_heading = False

        for index, line in enumerate(self.lines):
            match = self.DATE_HEADING_PATTERN.match(line)
            if not match:
                continue

            found_date_heading = True
            heading_date = match.group(1)
            logger.debug(f"Found markdown date heading: {heading_date}")

            if heading_date <= cutoff_date_str:
                cutoff_index = index
                logger.info(f"Found cutoff date: {heading_date} at line {index + 1}")
                break

        if not found_date_heading:
            logger.error("No valid '# YYYYMMDD' headings found in LEFT-OFF markdown")
            return False

        if cutoff_index is None:
            logger.warning("No cutoff date found - extracting entire markdown file")
            extracted_lines = list(self.lines)
        else:
            extracted_lines = self.lines[:cutoff_index]

        content = "\n".join(extracted_lines).rstrip() + "\n"

        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(content, encoding="utf-8")
            logger.info(f"Extracted content saved to: {output_file}")
            logger.info(f"Content length: {len(content)} characters")
            return True
        except Exception as exc:
            logger.error(f"Failed to save extracted content: {exc}")
            return False


DocumentParser = LeftOffMarkdownParser
