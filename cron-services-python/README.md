![PersonalWeb03 Logo](docs/assets/personalWeb03Logo.png)

# PersonalWeb03-Services

Automated services for PersonalWeb03 that run as scheduled cron jobs. Downloads and processes data from OneDrive and Toggl Track APIs.

## Outputs

### LEFT-OFF Service

**File**: `services-data/left-off-7-day-summary.json`

Generates AI-powered summaries of the last 7 days of activities from LEFT-OFF.docx.

```json
{
  "summary": "- Continued work on CadmusAI, focusing on IP address rate limiting.\n- Presented at the MLH / DigitalOcean Hackathon, deployed live demo.\n- Made UI fixes and architectural changes to PersonalWeb03.\n- Restored old blog entries and added admin features.",
  "datetime_summary": "2025-12-07 12:00:00"
}
```

**Temp Files**: `services-data/left-off-temp/`
- `LEFT-OFF.docx` - Downloaded document from OneDrive
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
TARGET_FILE_ID=your_onedrive_file_id
APPLICATION_ID=your_azure_app_id
CLIENT_SECRET=your_azure_client_secret
REFRESH_TOKEN=your_refresh_token
KEY_OPENAI=your_openai_api_key

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
```

**Exit Codes**:
- `0` - Success
- `1` - Error (auth, API, file issues)
- `2` - Time restriction (outside allowed window)

---

## Documentation

- **[DEVELOPMENT_NOTES.md](docs/DEVELOPMENT_NOTES.md)** - Complete engineering reference with API details, architecture, and troubleshooting
- **requirements/** - Original specifications used for initial development (historical reference)

---

## Time-Based Guardrail

Services run within a configurable daily time window for scheduled cron execution:
- **Default Window**: 23:00 - 23:10 (11:00 PM - 11:10 PM) daily
- **Configuration**: Set `TIME_WINDOW_START=HH:MM` in .env (e.g., `TIME_WINDOW_START=23:00`)
- **Window Duration**: Always 10 minutes from start time
- **Bypass**: Use `--run-anyway` flag or individual service flags for testing
