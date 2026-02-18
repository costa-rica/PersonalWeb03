# DEVELOPMENT_NOTES.md

Engineering reference for PersonalWeb03-Services codebase.

## Overview

This project consolidates multiple service scripts into a single application that runs as cron jobs in production. Each service can be invoked individually via CLI flags or run on a schedule with time-based guardrails.

## Project Structure

```
PersonalWeb03-Services/
├── src/
│   ├── main.py                      # Entry point with CLI and guardrail logic
│   ├── services/                    # Service implementations
│   │   ├── left_off/                # LEFT-OFF document summarization
│   │   │   ├── onedrive_client.py   # MS Graph API client for OneDrive
│   │   │   ├── document_parser.py   # .docx parsing and extraction
│   │   │   └── summarizer.py        # OpenAI-powered summarization
│   │   └── toggl/                   # (Future) Toggl Tracker service
│   ├── utils/                       # Shared utilities
│   │   ├── config.py                # Environment config and validation
│   │   └── guardrail.py             # Time-based execution control
│   └── templates/                   # Prompt templates
│       └── left-off-summarizer.md   # OpenAI prompt for LEFT-OFF
├── docs/
│   ├── REQUIREMENTS-LEFT-OFF.md     # LEFT-OFF service spec
│   ├── REQUIREMENTS-TOGGL.md        # Toggl service spec
│   └── reference-code/              # Original reference implementations
└── requirements.txt                 # Python dependencies
```

## Running the Services

### Individual Services
Services can be run anytime (bypass guardrail) with specific flags:
```bash
python src/main.py --run-left-off   # Run LEFT-OFF service
python src/main.py --run-toggl      # Run Toggl service (not implemented)
```

### Scheduled Execution (with Guardrail)
Running without flags triggers the time guardrail:
```bash
python src/main.py                  # Check time window, exit if outside
python src/main.py --run-anyway     # Bypass guardrail, show help
```

## Time-Based Guardrail

**File**: `src/utils/guardrail.py`

Enforces execution window for scheduled cron jobs:
- **Allowed Window**: Sunday 10:55 PM - 11:05 PM (local system time)
- **Exit Code**: 2 when blocked, 0 when allowed
- **Logging**: Shows current time, allowed window, and bypass instructions

**Implementation Notes**:
- Individual service flags (`--run-left-off`, etc.) bypass guardrail automatically
- `--run-anyway` flag bypasses guardrail for testing
- When `main.py` runs without service flags, guardrail is enforced
- Uses `datetime.now().weekday()` where 6 = Sunday

## Configuration

**File**: `src/utils/config.py`

Loads and validates environment variables from `.env`:

### Required Variables
- `PATH_PROJECT_RESOURCES` - Base path for output files
- `TARGET_FILE_ID` - OneDrive file ID for LEFT-OFF.docx
- `APPLICATION_ID` - Azure AD application ID
- `CLIENT_SECRET` - Azure AD client secret
- `REFRESH_TOKEN` - OneDrive refresh token (rotates on use)
- `KEY_OPENAI` - OpenAI API key

### Path Helpers
- `get_left_off_file_path()` → `{PATH_PROJECT_RESOURCES}/services-data/left-off-temp/LEFT-OFF.docx`
- `get_activities_file_path()` → `{PATH_PROJECT_RESOURCES}/services-data/left-off-temp/last-7-days-activities.md`
- `get_summary_json_path()` → `{PATH_PROJECT_RESOURCES}/services-data/left-off-7-day-summary.json`

**Directory Structure**:
- Temp files (downloaded .docx, extracted markdown) → `services-data/left-off-temp/`
- Final output (JSON summary) → `services-data/left-off-7-day-summary.json`

## Logging

All modules use Python's `logging` module with consistent formatting:
```python
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
```

Each module has its own logger: `logger = logging.getLogger(__name__)`

---

## LEFT-OFF Service

Downloads LEFT-OFF.docx from OneDrive, extracts last 7 days of activities, and generates AI-powered summaries.

### Workflow

1. **Download** (`onedrive_client.py`):
   - Authenticate via MSAL with refresh token
   - Download file by ID from MS Graph API
   - Save to `services-data/left-off-temp/LEFT-OFF.docx`

2. **Parse** (`document_parser.py`):
   - Load .docx with `python-docx`
   - Find cutoff date (8 days ago in YYYYMMDD format)
   - Extract all content before first Heading 1 ≥ cutoff
   - Convert to markdown and save to `services-data/left-off-temp/last-7-days-activities.md`

3. **Summarize** (`summarizer.py`):
   - Load prompt template from `templates/left-off-summarizer.md`
   - Replace `<< last-7-days-activities.md >>` placeholder with extracted content
   - Call OpenAI API (gpt-4o-mini) with `response_format={"type": "json_object"}`
   - Save JSON response to `services-data/left-off-7-day-summary.json`
   - Print result to console

### OneDrive Authentication

**File**: `src/services/left_off/onedrive_client.py`

Uses MSAL's `ConfidentialClientApplication` with refresh tokens:
- Authority: `https://login.microsoftonline.com/consumers`
- Scopes: `['Files.Read', 'Files.Read.All']`
- **Token Rotation**: Refresh tokens may rotate on use (Microsoft security policy)
  - New tokens logged as WARNING (commented out to avoid secrets in logs)
  - Update `.env` manually if authentication fails

### Document Structure Expectations

The LEFT-OFF.docx file must follow this structure:
- **Heading 1**: Date in YYYYMMDD format (e.g., `20251207`)
- **Heading 2**: Section headers (e.g., "LEFT-OFF", "Accomplished Today")
- **Organization**: Most recent entries at top, oldest at bottom

Parser extracts all paragraphs until it finds the first Heading 1 date that is ≥ 8 days old.

### OpenAI Integration

**File**: `src/services/left_off/summarizer.py`

- **Model**: `gpt-4o-mini` (configurable)
- **Response Format**: JSON object with `summary` and `datetime_summary` fields
- **Template**: `src/templates/left-off-summarizer.md` defines the prompt structure
- **Error Handling**: Catches JSON decode errors, file not found, API failures

**Template Customization**:
Edit `templates/left-off-summarizer.md` to modify summary style, length, or format.

### Output Files

1. **Temp Files** (in `services-data/left-off-temp/`):
   - `LEFT-OFF.docx` - Downloaded document
   - `last-7-days-activities.md` - Extracted markdown

2. **Final Output** (in `services-data/`):
   - `left-off-7-day-summary.json` - JSON with summary and timestamp

### Error Cases

- **Invalid/Expired Refresh Token**: Returns exit code 1, logs auth error
- **Missing Document Structure**: Parser warns if no cutoff date found, extracts entire doc
- **OpenAI API Failure**: Returns exit code 1, logs API error with details
- **Missing Template**: Returns exit code 1, logs file not found

---

## Toggl Track Service

**Status**: Not yet implemented

**Requirements**: See `docs/REQUIREMENTS-TOGGL.md`

**Planned Output**: `services-data/project_time_entries.csv`

---

## Exit Codes

- **0**: Success - all operations completed
- **1**: Error - operational failure (auth, file, API errors)
- **2**: Time restriction - execution outside allowed Sunday window

Use exit codes for cron job monitoring and alerting.

## Dependencies

See `requirements.txt`:
- `msal` - Microsoft Authentication Library for OneDrive
- `python-docx` - Parse .docx files
- `requests` - HTTP requests for Graph API
- `openai` - OpenAI API client
- `python-dotenv` - Load .env files
- `httpx==0.27.2` - HTTP client (pinned for OpenAI compatibility)

**Version Notes**:
- `httpx` pinned to 0.27.2 due to incompatibility between 0.28.x and OpenAI SDK
- `openai` uses JSON mode for structured responses

## Development Workflow

1. **Adding New Services**:
   - Create service directory under `src/services/`
   - Add CLI flag to `main.py`
   - Add config methods to `utils/config.py`
   - Document in new `REQUIREMENTS-{SERVICE}.md`

2. **Modifying Prompts**:
   - Edit templates in `src/templates/`
   - No code changes needed for prompt adjustments

3. **Testing**:
   - Use `--run-{service}` flags for individual testing
   - Use `--run-anyway` to bypass guardrail during development
   - Check logs for detailed execution flow

4. **Production Deployment**:
   - Deploy as cron job on Sunday 11:00 PM
   - Monitor exit codes for success/failure
   - Update `.env` if refresh tokens expire
