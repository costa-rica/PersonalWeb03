"""
Time aggregator for summing hours by project.
"""

from collections import defaultdict
from datetime import datetime
from loguru import logger


class TimeAggregator:
    """Aggregates time entries by project."""

    DESCRIPTION_OVERRIDE_PROJECT = 'Pro bono and hackathons'

    @staticmethod
    def aggregate_by_project(time_entries, projects):
        """
        Aggregate time entries by project and calculate hours worked.

        Args:
            time_entries: List of time entry dicts from Toggl API
            projects: List of project dicts from Toggl API

        Returns:
            list: List of dicts with project_name and hours_worked
        """
        logger.info("Aggregating time entries by project")

        project_map = {
            project['id']: {
                'name': project['name'],
                'description': project.get('description')
            }
            for project in projects
        }
        project_map[None] = {
            'name': 'No Project',
            'description': None
        }

        # Sum durations by project ID
        project_durations = defaultdict(int)
        latest_descriptions = {}
        
        for entry in time_entries:
            project_id = entry.get('project_id')
            duration = entry.get('duration', 0)

            TimeAggregator._capture_latest_description(
                latest_descriptions,
                project_id,
                entry
            )

            # Only count positive durations (negative means currently running)
            if duration > 0:
                project_durations[project_id] += duration

        # Convert to list of results with hours
        results = []
        for project_id, total_seconds in project_durations.items():
            project_details = project_map.get(project_id, {
                'name': f'Unknown Project ({project_id})',
                'description': None
            })
            project_name = TimeAggregator._resolve_project_label(
                project_details,
                latest_descriptions.get(project_id)
            )
            hours_worked = round(total_seconds / 3600, 2)
            
            results.append({
                'project_name': project_name,
                'hours_worked': hours_worked
            })

        # Sort by hours worked (descending)
        results.sort(key=lambda x: x['hours_worked'], reverse=True)

        logger.info(f"Aggregated {len(results)} project(s)")
        return results

    @staticmethod
    def _capture_latest_description(latest_descriptions, project_id, entry):
        description = (entry.get('description') or '').strip()
        if not description:
            return

        candidate_timestamp = TimeAggregator._extract_entry_timestamp(entry)
        current = latest_descriptions.get(project_id)

        if current is None or candidate_timestamp >= current['timestamp']:
            latest_descriptions[project_id] = {
                'description': description,
                'timestamp': candidate_timestamp
            }

    @staticmethod
    def _extract_entry_timestamp(entry):
        for key in ('start', 'at', 'stop'):
            value = entry.get(key)
            if not value:
                continue

            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                continue

        return datetime.min

    @staticmethod
    def _resolve_project_label(project_details, latest_entry_description):
        project_name = project_details['name']
        if project_name != TimeAggregator.DESCRIPTION_OVERRIDE_PROJECT:
            return project_name

        project_description = (project_details.get('description') or '').strip()
        if project_description:
            return project_description

        if latest_entry_description:
            return latest_entry_description['description']

        return project_name
