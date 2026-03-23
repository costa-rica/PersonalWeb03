"""
Configuration management for PersonalWeb03-Services.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger


class Config:
    """Configuration settings loaded from environment variables."""

    def __init__(self):
        """Load configuration from .env file."""
        # Load environment variables
        load_dotenv()
        
        # Project paths
        self.path_project_resources = os.getenv('PATH_PROJECT_RESOURCES')
        if not self.path_project_resources:
            raise ValueError("PATH_PROJECT_RESOURCES not set in .env")
        
        self.services_data_dir = Path(self.path_project_resources) / 'services-data'
        
        # Check if services-data directory exists
        if not self.services_data_dir.exists():
            logger.warning(
                f"services-data directory does not exist: {self.services_data_dir}. "
                "This directory should be created before running services."
            )
        
        # LEFT-OFF service config
        self.left_off_source_dir = Path(self.path_project_resources) / 'obsidian'
        self.left_off_source_name = 'LEFT-OFF.md'
        
        # OpenAI config
        self.openai_base_url = os.getenv('URL_BASE_OPENAI', 'https://api.openai.com/v1')
        self.openai_api_key = os.getenv('KEY_OPENAI')
        
        # Toggl config
        self.toggl_api_token = os.getenv('TOGGL_API_TOKEN')
        
        # Time guardrail config
        self.time_window_start = os.getenv('TIME_WINDOW_START', '23:00')

    def validate_left_off_config(self):
        """
        Validate that all required config for LEFT-OFF service is present.
        
        Raises:
            ValueError: If required configuration is missing
        """
        required = {
            'KEY_OPENAI': self.openai_api_key,
        }
        
        missing = [key for key, value in required.items() if not value]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        logger.info("LEFT-OFF configuration validated successfully")

    def get_left_off_source_path(self):
        """Get the full path for the LEFT-OFF.md source file."""
        return self.left_off_source_dir / self.left_off_source_name

    def get_activities_file_path(self):
        """Get the full path for the last-7-days-activities.md file."""
        return self.services_data_dir / 'left-off-temp' / 'last-7-days-activities.md'
    
    def get_summary_json_path(self):
        """Get the full path for the summary JSON output file."""
        return self.services_data_dir / 'left-off-7-day-summary.json'
    
    def validate_toggl_config(self):
        """
        Validate that all required config for Toggl service is present.
        
        Raises:
            ValueError: If required configuration is missing
        """
        required = {
            'TOGGL_API_TOKEN': self.toggl_api_token,
        }
        
        missing = [key for key, value in required.items() if not value]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        logger.info("Toggl configuration validated successfully")
    
    def get_toggl_csv_path(self):
        """Get the full path for the Toggl CSV output file."""
        return self.services_data_dir / 'project_time_entries.csv'
