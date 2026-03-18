# AGENT.md

This file provides guidance to engineers and coding agents when working in `cron-services-python/`.

## Project Overview

`cron-services-python` is the scheduled-services package in the PersonalWeb03 monorepo. It runs standalone Python jobs that write artifacts into `PATH_PROJECT_RESOURCES/services-data/` for the rest of the site to consume.

There are two service flows:

- LEFT-OFF: downloads `LEFT-OFF.docx` from OneDrive, extracts the most recent activity window, and writes `left-off-7-day-summary.json`
- Toggl: fetches recent Toggl Track time entries, aggregates them by project, and writes `project_time_entries.csv`

## Common Commands

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run both services with the time guardrail
python src/main.py

# Run both services and bypass the time guardrail
python src/main.py --run-anyway

# Run individual services directly
python src/main.py --run-left-off
python src/main.py --run-toggl

# Compile-check the package without running network calls
python -m compileall src
```

## Environment and Secrets

This project depends on a local `.env` file in `cron-services-python/`. Before running anything that touches external services, confirm these values are present and valid:

- Shared runtime: `NAME_APP`, `RUN_ENVIRONMENT`, `PATH_PROJECT_RESOURCES`
- Logging in testing or production: `PATH_TO_LOGS`
- LEFT-OFF: `TARGET_FILE_ID`, `APPLICATION_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, `KEY_OPENAI`
- Optional LEFT-OFF overrides: `NAME_TARGET_FILE`, `URL_BASE_OPENAI`
- Toggl: `TOGGL_API_TOKEN`
- Guardrail: `TIME_WINDOW_START`

Treat `.env`, tokens, and downloaded outputs as sensitive. Do not print secrets into logs, commits, screenshots, or markdown docs.

## Architecture

```text
src/
├── main.py                        # CLI entry point and orchestration
├── get_auth_token.py              # One-time helper to obtain OneDrive refresh token
├── services/
│   ├── left_off/
│   │   ├── onedrive_client.py     # MS Graph auth + download
│   │   ├── document_parser.py     # Extract recent sections from the .docx
│   │   └── summarizer.py          # OpenAI call that returns JSON
│   └── toggl/
│       ├── toggl_client.py        # Toggl Track API client
│       └── time_aggregator.py     # Groups durations by project
├── templates/
│   └── left-off-summarizer.md     # Prompt template
└── utils/
    ├── config.py                  # Env loading and path helpers
    ├── guardrail.py               # Allowed execution window
    └── logging_config.py          # Loguru configuration
```

## Expected Outputs

All outputs are rooted under `PATH_PROJECT_RESOURCES/services-data/`:

- `left-off-temp/LEFT-OFF.docx`
- `left-off-temp/last-7-days-activities.md`
- `left-off-7-day-summary.json`
- `project_time_entries.csv`

The web and API projects may rely on these files being present and shaped consistently, so preserve filenames and top-level JSON and CSV columns unless the consuming code is updated too.

## Working Rules

- Prefer reading the current code over trusting `docs/DEVELOPMENT_NOTES.md`; that file has drifted and does not fully match the implementation.
- Keep service entrypoints in `src/main.py` thin. Put external API logic in service modules and env parsing in `utils/config.py`.
- Preserve exit code semantics: `0` success, `1` operational error, `2` blocked by guardrail.
- Be careful with the LEFT-OFF document format. `DocumentParser` expects Heading 1 paragraphs with dates in `YYYYMMDD` order, newest first.
- If you change prompt behavior, edit `src/templates/left-off-summarizer.md` instead of hardcoding prompt text in Python.
- When changing paths or output schemas, search the whole monorepo for consumers before editing.
- Avoid adding networked tests that hit live APIs. Prefer isolated unit tests or compile checks.

## Known Risks and Project Quirks

- `Summarizer` accepts a `base_url` argument, but the current implementation does not pass it into the `OpenAI` client. If you are trying to support a non-default OpenAI-compatible endpoint, verify that path first.
- Running `--run-toggl` can fail when `services-data/` does not already exist because the CSV write path is not created on demand.
- The guardrail is implemented as a daily local-time window, not a weekly schedule.
- `src/get_auth_token.py` opens a local browser flow on `http://localhost:8000`, so avoid changing that without also updating the Azure app registration.

## Safe Validation

Use these checks first when making changes:

- `python -m compileall src`
- `python src/main.py --help`

Only run the live services when the local `.env` is configured and you intentionally want to contact OneDrive, OpenAI, or Toggl.
