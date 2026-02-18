"""
Time aggregator for summing hours by project.
"""

from collections import defaultdict
from loguru import logger


class TimeAggregator:
    """Aggregates time entries by project."""

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

        # Create project ID to name mapping
        project_map = {p['id']: p['name'] for p in projects}
        project_map[None] = 'No Project'  # For entries without a project

        # Sum durations by project ID
        project_durations = defaultdict(int)
        
        for entry in time_entries:
            project_id = entry.get('project_id')
            duration = entry.get('duration', 0)
            
            # Only count positive durations (negative means currently running)
            if duration > 0:
                project_durations[project_id] += duration

        # Convert to list of results with hours
        results = []
        for project_id, total_seconds in project_durations.items():
            project_name = project_map.get(project_id, f'Unknown Project ({project_id})')
            hours_worked = round(total_seconds / 3600, 2)
            
            results.append({
                'project_name': project_name,
                'hours_worked': hours_worked
            })

        # Sort by hours worked (descending)
        results.sort(key=lambda x: x['hours_worked'], reverse=True)

        logger.info(f"Aggregated {len(results)} project(s)")
        return results
