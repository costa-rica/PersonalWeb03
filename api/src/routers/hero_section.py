"""Hero section router for providing homepage data."""

import os
import csv
import json
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from dotenv import load_dotenv
from loguru import logger

from src.schemas import HeroSectionData, UpToLately, TogglTableItem

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/hero-section", tags=["Hero Section"])

# Get project resources path from environment
PATH_PROJECT_RESOURCES = os.getenv("PATH_PROJECT_RESOURCES")
if not PATH_PROJECT_RESOURCES:
    raise ValueError("PATH_PROJECT_RESOURCES must be set in .env file")

# GET /hero-section/data
@router.get("/data", response_model=HeroSectionData)
def get_hero_section_data():
    """
    Get hero section data including up_to_lately text and toggl table.

    Returns:
        HeroSectionData: Hero section data with text and project hours

    Raises:
        HTTPException: If files are not found or cannot be read
    """
    logger.info("Fetching hero section data")

    hero_section_dir = Path(PATH_PROJECT_RESOURCES) / "services-data"

    # Read up_to_lately text and date from JSON file
    json_file_path = hero_section_dir / "left-off-7-day-summary.json"
    if not json_file_path.exists():
        logger.error(f"JSON file not found: {json_file_path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activities summary file not found"
        )

    try:
        with open(json_file_path, 'r', encoding='utf-8') as jsonfile:
            summary_data = json.load(jsonfile)
        
        up_to_lately_text = summary_data.get('summary', '').strip()
        # Get the full datetime_summary from JSON
        datetime_summary = summary_data.get('datetime_summary', '')
        
        logger.debug(f"Read summary from JSON: {len(up_to_lately_text)} characters")
    except Exception as e:
        logger.error(f"Error reading JSON file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error reading activities summary"
        )

    # Read and parse CSV file for toggl table
    csv_file_path = hero_section_dir / "project_time_entries.csv"
    if not csv_file_path.exists():
        logger.error(f"CSV file not found: {csv_file_path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project time entries file not found"
        )

    try:
        toggl_items = []

        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Parse project data
                toggl_items.append(TogglTableItem(
                    project_name=row['project_name'],
                    total_hours=float(row['hours_worked'])
                ))

        logger.info(f"Parsed {len(toggl_items)} projects from CSV")

    except Exception as e:
        logger.error(f"Error reading CSV file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error reading project time entries"
        )

    # Sort projects alphabetically by name
    toggl_items.sort(key=lambda x: x.project_name.lower())
    logger.debug("Sorted projects alphabetically")

    # Build response
    response = HeroSectionData(
        up_to_lately=UpToLately(
            text=up_to_lately_text,
            datetime_summary=datetime_summary
        ),
        toggl_table=toggl_items
    )

    logger.info("Hero section data retrieved successfully")
    return response
