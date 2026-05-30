![PersonalWeb03 Logo](docs/assets/personalWeb03Logo.png)

# PersonalWeb03-Services

Automated services for PersonalWeb03 that run as scheduled jobs. Copies NickVault logbook data into the worker input path and processes Toggl Track API data.

## Outputs

### LEFT-OFF Service

**File**: `services-data/left-off-7-day-summary.json`

Generates AI-powered summaries of the last 7 days of activities from `services-data/LEFT-OFF.md`. That worker-side file is a temporary compatibility artifact; `scripts/sync_left_off.py` copies the upstream NickVault root `logbook.md` into it before the worker runs.

```json
{
  "summary": "- Continued work on CadmusAI, focusing on IP address rate limiting.\n- Presented at the MLH / DigitalOcean Hackathon, deployed live demo.\n- Made UI fixes and architectural changes to PersonalWeb03.\n- Restored old blog entries and added admin features.",
  "datetime_summary": "2025-12-07 12:00:00"
}
```

**Temp Files**: `services-data/left-off-temp/`
- `last-7-days-activities.md` - Extracted activities in markdown

---

### Toggl Service

**File**: `services-data/project_time_entries.csv`

Tracks time worked on each project over the last 7 days.

```csv
project_name,hours_worked,datetime_collected
Sharpening the Saw,31.68,2025-12-07 12:18:50
Networking - DataKind,10.49,2025-12-07 12:18:50
Search for work,3.21,2025-12-07 12:18:50
```

---

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

**Environment Variables**: Add to `.env`
```bash
# Shared
PATH_PROJECT_RESOURCES=/path/to/project/resources

# LEFT-OFF Service
KEY_OPENAI=your_openai_api_key
# Optional path overrides
PATH_LEFT_OFF_SOURCE=/path/to/project/resources/services-data/LEFT-OFF.md
PATH_LEFT_OFF_NICKVAULT_SOURCE=/home/nick/NickVault/logbook.md
PATH_LEFT_OFF_DESTINATION=/path/to/project/resources/services-data/LEFT-OFF.md

# Toggl Service
TOGGL_API_TOKEN=your_toggl_api_token
```

---

## Usage

```bash
# Run both services (default - respects time window)
python src/main.py                    # Runs LEFT-OFF + Toggl during 23:00-23:10 window
python src/main.py --run-anyway       # Runs LEFT-OFF + Toggl anytime (bypass guardrail)

# Run individual services (anytime - bypass guardrail)
python src/main.py --run-left-off     # LEFT-OFF only
python src/main.py --run-toggl        # Toggl only

# Copy NickVault logbook.md into the temporary LEFT-OFF worker input path
python scripts/sync_left_off.py

# Run the unit tests
python -m unittest discover -s tests
```

**Exit Codes**:
- `0` - Success
- `1` - Error (auth, API, file issues)
- `2` - Time restriction (outside allowed window)

---

## Documentation

- **[DEVELOPMENT_NOTES.md](docs/DEVELOPMENT_NOTES.md)** - Complete engineering reference with API details, architecture, and troubleshooting
- **requirements/** - Original specifications used for initial development (historical reference)

## LEFT-OFF Input Contract

The LEFT-OFF service reads from `PATH_PROJECT_RESOURCES/services-data/LEFT-OFF.md` by default. For the current deployment cycle, keep that filename and the existing left-off command/unit names. The upstream source of truth is NickVault root `logbook.md`, copied into the worker input path by `scripts/sync_left_off.py`.

Default path behavior:

- NickVault source: prefer `/home/nick/NickVault/logbook.md`; fall back to `/home/nick/NickVault/LEFT-OFF.md` only when the preferred source is absent.
- Worker input: `PATH_LEFT_OFF_SOURCE` defaults to `PATH_PROJECT_RESOURCES/services-data/LEFT-OFF.md`.
- Copy destination: `PATH_LEFT_OFF_DESTINATION` defaults to `PATH_LEFT_OFF_SOURCE`, or to `PATH_PROJECT_RESOURCES/services-data/LEFT-OFF.md` when no worker source override is set.

- Top-level date headings must use `# YYYYMMDD`
- Top-level date headings should be newest first
- YAML frontmatter before the first date heading is allowed
- Canon logbook day sections use `## Accomplished Today` and `## Still Open`
- All content under a date heading belongs to that day until the next top-level date heading
- Markdown content such as task items, code snippets, and plain text is preserved before summarization

---

## Time-Based Guardrail

Services run within a configurable daily time window for scheduled cron execution:
- **Default Window**: 23:00 - 23:10 (11:00 PM - 11:10 PM) daily unless the systemd timer runs `src/main.py --run-anyway`
- **Configuration**: Set `TIME_WINDOW_START=HH:MM` in .env (e.g., `TIME_WINDOW_START=23:00`)
- **Window Duration**: Always 10 minutes from start time
- **Bypass**: Use `--run-anyway` flag or individual service flags for testing

The active systemd reference templates use LA-local ordering for the NickVault logbook flow: NickVault generation at about 01:00 America/Los_Angeles, PersonalWeb03 copy at about 02:00 after that succeeds, and the worker at about 02:30 after the copy succeeds.
