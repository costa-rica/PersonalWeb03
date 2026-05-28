"""
Toggl Track API client.
"""

import requests
from datetime import datetime, timedelta
from requests.auth import HTTPBasicAuth
from loguru import logger


class TogglClient:
    """Client for interacting with Toggl Track API v9."""

    BASE_URL = 'https://api.track.toggl.com/api/v9'

    def __init__(self, api_token):
        """
        Initialize Toggl client.

        Args:
            api_token: Toggl API token for authentication
        """
        self.api_token = api_token
        self.auth = HTTPBasicAuth(api_token, 'api_token')
        logger.info("Toggl client initialized")

    def get_workspaces(self):
        """
        Get all workspaces for the authenticated user.

        Returns:
            list: List of workspace dicts, or None if error
        """
        url = f'{self.BASE_URL}/me/workspaces'
        logger.info("Fetching workspaces")

        try:
            response = requests.get(url, auth=self.auth)

            if response.status_code == 200:
                workspaces = response.json()
                logger.info(f"Found {len(workspaces)} workspace(s)")
                return workspaces
            else:
                logger.error(f"Failed to fetch workspaces: HTTP {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None

        except Exception as e:
            logger.error(f"Exception while fetching workspaces: {e}")
            return None

    def get_projects(self, workspace_id):
        """
        Get all projects for a workspace.

        Args:
            workspace_id: ID of the workspace

        Returns:
            list: List of project dicts, or None if error
        """
        url = f'{self.BASE_URL}/workspaces/{workspace_id}/projects'
        logger.info(f"Fetching projects for workspace {workspace_id}")

        try:
            response = requests.get(url, auth=self.auth)

            if response.status_code == 200:
                projects = response.json()
                logger.info(f"Found {len(projects)} project(s)")
                return projects
            else:
                logger.error(f"Failed to fetch projects: HTTP {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None

        except Exception as e:
            logger.error(f"Exception while fetching projects: {e}")
            return None

    def get_time_entries(self, start_date, end_date):
        """
        Get time entries for a date range.

        Args:
            start_date: Start date (datetime object)
            end_date: End date (datetime object)

        Returns:
            list: List of time entry dicts, or None if error
        """
        # Format dates as YYYY-MM-DD
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')
        
        url = f'{self.BASE_URL}/me/time_entries'
        params = {
            'start_date': start_str,
            'end_date': end_str
        }
        
        logger.info(f"Fetching time entries from {start_str} to {end_str}")

        try:
            response = requests.get(url, auth=self.auth, params=params)

            if response.status_code == 200:
                entries = response.json()
                logger.info(f"Found {len(entries)} time entries")
                return entries
            else:
                logger.error(f"Failed to fetch time entries: HTTP {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None

        except Exception as e:
            logger.error(f"Exception while fetching time entries: {e}")
            return None
