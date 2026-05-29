import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"

if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))


from services.toggl.time_aggregator import TimeAggregator


class TimeAggregatorTests(unittest.TestCase):
    def test_uses_latest_time_entry_description_for_target_project(self):
        projects = [
            {'id': 1, 'name': 'Pro bono and hackathons'},
            {'id': 2, 'name': 'Client work'},
        ]
        time_entries = [
            {
                'project_id': 1,
                'duration': 1800,
                'description': 'Old label',
                'start': '2026-04-18T09:00:00Z',
            },
            {
                'project_id': 1,
                'duration': 3600,
                'description': 'AI for nonprofit intake automation',
                'start': '2026-04-19T09:00:00Z',
            },
            {
                'project_id': 2,
                'duration': 7200,
                'description': 'Ignored for other projects',
                'start': '2026-04-19T10:00:00Z',
            },
        ]

        results = TimeAggregator.aggregate_by_project(time_entries, projects)

        self.assertEqual(results[0]['project_name'], 'Client work')
        self.assertEqual(results[1]['project_name'], 'AI for nonprofit intake automation')
        self.assertEqual(results[1]['hours_worked'], 1.5)

    def test_prefers_project_description_when_available(self):
        projects = [
            {
                'id': 1,
                'name': 'Pro bono and hackathons',
                'description': 'Project-level description from Toggl',
            }
        ]
        time_entries = [
            {
                'project_id': 1,
                'duration': 3600,
                'description': 'Entry-level description',
                'start': '2026-04-19T09:00:00Z',
            }
        ]

        results = TimeAggregator.aggregate_by_project(time_entries, projects)

        self.assertEqual(results[0]['project_name'], 'Project-level description from Toggl')

    def test_falls_back_to_original_project_name_without_description(self):
        projects = [{'id': 1, 'name': 'Pro bono and hackathons'}]
        time_entries = [{'project_id': 1, 'duration': 3600, 'description': '   '}]

        results = TimeAggregator.aggregate_by_project(time_entries, projects)

        self.assertEqual(results[0]['project_name'], 'Pro bono and hackathons')


if __name__ == "__main__":
    unittest.main()
