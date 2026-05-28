---
created_at: 2026-05-28
updated_at: 2026-05-28
created_by: codex (gpt-5)
modified_by: operator (nick)
---

# Cron Services Python Daily Flow

This document describes the current daily flow for `worker-python`, based on the implementation in `worker-python/src/` and the host `personalweb03-services.service` / `personalweb03-services.timer` units inspected on 2026-05-28. It avoids older notes where they conflict with the current code.

## Package Purpose

`worker-python` is the scheduled-services package for PersonalWeb03. Its jobs write homepage data artifacts under:

```text
PATH_PROJECT_RESOURCES/services-data/
```

The API reads those artifacts from `api/src/routers/hero_section.py`, and the web frontend displays the resulting summary date and project-hour table in `web/src/components/HeroSection.tsx`.

## Daily Systemd Schedule

The current host timer for the daily job is:

```ini
[Timer]
OnCalendar=*-*-* 23:00:00
Persistent=true
```

This schedules the job daily at 23:00 local system time. `Persistent=true` means systemd should catch up a missed timer activation after the machine is available again.

The current host service is a one-shot unit that runs from the package directory:

```ini
WorkingDirectory=/home/limited_user/applications/PersonalWeb03/worker-python/
EnvironmentFile=/home/limited_user/applications/PersonalWeb03/worker-python/.env
ExecStart=/home/limited_user/environments/personal_web03/bin/python src/main.py --run-anyway
Restart=on-failure
RestartSec=10
StartLimitIntervalSec=1d
StartLimitBurst=5
```

The important behavior is that `personalweb03-services.service` runs:

```bash
python src/main.py --run-anyway
```

That executes both services and bypasses the application-level time guardrail. The timer itself is therefore the production scheduler; the guardrail still protects no-flag manual or cron-style runs.

## CLI Modes

The entrypoint is `worker-python/src/main.py`.

```bash
python src/main.py
```

Runs both services with the time guardrail. The guardrail defaults to a daily 23:00-23:10 window unless `TIME_WINDOW_START=HH:MM` overrides the start time.

```bash
python src/main.py --run-anyway
```

Runs both services and bypasses the time guardrail. This is what `personalweb03-services.service` currently uses.

```bash
python src/main.py --run-left-off
python src/main.py --run-toggl
```

Runs one service directly and bypasses the time guardrail. If both individual flags are supplied, the current `if` / `elif` ordering runs only LEFT-OFF.

All modes call `load_dotenv()` and `configure_logging()` before argument handling completes, so even `--help` depends on the required logging environment being present.

## Daily Combined Flow

In combined mode, `main.py` performs this sequence:

1. Load environment variables from `worker-python/.env`.
2. Configure Loguru logging through `src/utils/logging_config.py`.
3. Parse CLI flags.
4. If no individual service flag is present, create `Config()` and enforce the time guardrail unless `--run-anyway` was supplied.
5. Run the Toggl service first.
6. Run the LEFT-OFF service second.
7. Exit with LEFT-OFF failure if LEFT-OFF failed; otherwise exit with the Toggl exit code.

Running Toggl before LEFT-OFF lets the LEFT-OFF prompt include the refreshed `project_time_entries.csv` when Toggl succeeds. If Toggl fails, `main.py` logs a warning and still runs LEFT-OFF using the previous CSV if one exists, or with the prompt fallback text if the CSV is unavailable.

## Toggl Flow

`run_toggl_service()` writes the project-hour CSV.

Inputs:

- `PATH_PROJECT_RESOURCES`, used to locate `services-data/`
- `TOGGL_API_TOKEN`
- Toggl Track API v9 endpoints under `https://api.track.toggl.com/api/v9`

Steps:

1. Validate Toggl configuration.
2. Fetch workspaces from `/me/workspaces`.
3. Select the first workspace returned by Toggl.
4. Fetch workspace projects from `/workspaces/{workspace_id}/projects`.
5. Fetch time entries from `/me/time_entries`.
6. Use a date range from `datetime.now() - 6 days` through tomorrow's date as sent to Toggl. The code comments note that the end date is intended to be exclusive so today's entries are included.
7. Aggregate positive-duration entries by project with `TimeAggregator.aggregate_by_project()`.
8. Sort aggregated rows by `hours_worked` descending.
9. Write the CSV.

Output:

```text
PATH_PROJECT_RESOURCES/services-data/project_time_entries.csv
```

CSV columns:

```csv
project_name,hours_worked,datetime_collected
```

Aggregation details:

- Negative durations, which indicate a currently running Toggl timer, are ignored.
- Entries without a project are grouped as `No Project`.
- Unknown project IDs are labeled as `Unknown Project ({project_id})`.
- For the project named `Pro bono and hackathons`, the label can be replaced by the project description or the latest entry description.

Current write-path guardrail: `Config()` warns if `services-data/` does not exist, but the Toggl CSV writer does not create the parent directory. A missing `services-data/` directory can therefore make Toggl fail while writing the CSV.

## LEFT-OFF Flow

`run_left_off_service()` extracts recent markdown activity and writes the homepage summary JSON.

Inputs:

- `PATH_PROJECT_RESOURCES`, used to locate the source and outputs
- `KEY_OPENAI`
- Optional `URL_BASE_OPENAI`, loaded by config but not currently passed into the OpenAI client implementation
- `PATH_PROJECT_RESOURCES/obsidian/LEFT-OFF.md`
- `PATH_PROJECT_RESOURCES/services-data/project_time_entries.csv`, optional prompt context
- `worker-python/src/templates/left-off-summarizer.md`

Steps:

1. Validate LEFT-OFF configuration.
2. Confirm `PATH_PROJECT_RESOURCES/obsidian/LEFT-OFF.md` exists.
3. Load the markdown source.
4. Find top-level date headings matching `# YYYYMMDD`.
5. Compute a cutoff as `datetime.now() - 8 days`, formatted as `YYYYMMDD`.
6. Extract all lines before the first top-level date heading that is at or older than the cutoff.
7. Write the extracted markdown to the temp output.
8. Read the prompt template and replace `<< last-7-days-activities.md >>` with the extracted markdown.
9. Read `project_time_entries.csv` if it exists, otherwise use `Toggl data unavailable for this run.` in the prompt.
10. Call OpenAI chat completions with model `gpt-4o-mini` and JSON-object response format.
11. Parse the JSON response.
12. Override `datetime_summary` with the current local timestamp.
13. Write the final JSON.

Temp output:

```text
PATH_PROJECT_RESOURCES/services-data/left-off-temp/last-7-days-activities.md
```

Final output:

```text
PATH_PROJECT_RESOURCES/services-data/left-off-7-day-summary.json
```

Expected JSON fields:

```json
{
	"summary": "markdown summary text",
	"datetime_summary": "YYYY-MM-DD HH:MM:SS"
}
```

LEFT-OFF source format guardrails:

- Date headings must be top-level markdown headings in `# YYYYMMDD` format.
- The parser expects newest sections first.
- Content belongs to a date until the next top-level date heading.
- If no valid date headings are found, extraction fails.
- If no cutoff heading is found, the parser warns and extracts the entire markdown file.

## Environment Guardrails

`Config()` requires:

- `PATH_PROJECT_RESOURCES`

Logging requires:

- `NAME_APP`
- `RUN_ENVIRONMENT`, one of `development`, `testing`, or `production`
- `PATH_TO_LOGS` when `RUN_ENVIRONMENT` is `testing` or `production`

Service-specific configuration requires:

- `KEY_OPENAI` for LEFT-OFF
- `TOGGL_API_TOKEN` for Toggl

Guardrail configuration:

- `TIME_WINDOW_START` is optional and defaults to `23:00`.
- The allowed window is always 10 minutes from the configured start.
- The guardrail uses local `datetime.now()`.
- Windows that cross midnight are supported.
- An invalid `TIME_WINDOW_START` format blocks guarded runs with exit code `2`.

Do not document or print actual `.env` secret values.

## Exit Codes and Failure Behavior

Exit code `0` means success.

Exit code `1` means an operational or configuration error. Examples include missing required environment variables, logging setup failure, missing LEFT-OFF source file, OpenAI failure, invalid OpenAI JSON, Toggl API failure, or file write failure.

Exit code `2` means the time guardrail blocked a no-flag combined run.

Combined-run behavior:

- If the guardrail blocks the run, neither service runs and the process exits `2`.
- If Toggl fails, the process continues to LEFT-OFF and exits with LEFT-OFF's code if LEFT-OFF fails.
- If Toggl fails but LEFT-OFF succeeds, the process exits with Toggl's nonzero code.
- If LEFT-OFF fails, the process exits with LEFT-OFF's code.
- If both succeed, the process exits `0`.

Systemd behavior:

- `personalweb03-services.service` uses `Restart=on-failure`, `RestartSec=10`, and `StartLimitBurst=5` within `StartLimitIntervalSec=1d`.
- Because the service runs `--run-anyway`, application guardrail exit code `2` should not occur in the current daily systemd path unless the unit command changes.

## Downstream Consumers

The API endpoint `GET /hero-section/data` reads:

- `PATH_PROJECT_RESOURCES/services-data/left-off-7-day-summary.json`
- `PATH_PROJECT_RESOURCES/services-data/project_time_entries.csv`

It maps:

- JSON `summary` to `up_to_lately.text`
- JSON `datetime_summary` to `up_to_lately.datetime_summary`
- CSV `project_name` and `hours_worked` to `toggl_table`

The frontend displays the summary, renders the project-hour table, and shows the date portion of `datetime_summary`.
