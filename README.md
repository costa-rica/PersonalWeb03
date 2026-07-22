---
created_at: 2026-07-22
updated_at: 2026-07-22
created_by: codex (gpt-5)
modified_by: codex (gpt-5)
---

![Personal Web 03 logo](docs/images/android-chrome-192x192.png)

# Personal Web 03

Personal Web 03 is a monorepo for a personal website, its API, and scheduled data workers.

---

## Project Overview

The Next.js frontend displays portfolio, resume, books, blog, and recent-activity content. FastAPI serves application data and downloadable assets, while Python workers prepare activity summaries and time-tracking data.

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, FastAPI, Python, SQLAlchemy, SQLite

---

## Setup

Prerequisites:

- Node.js 20.9 or newer and npm.
- Python 3.13 and pip.
- Local directories for the SQLite database, blog content, logs, downloadable assets, and worker data.
- OpenAI and Toggl credentials when running the scheduled workers.

1. Create the Python environments and install dependencies from the repository root.

   ```bash
   python3 -m venv api/venv
   source api/venv/bin/activate
   python -m pip install -r api/requirements.txt
   deactivate

   python3 -m venv worker-python/venv
   source worker-python/venv/bin/activate
   python -m pip install -r worker-python/requirements.txt
   deactivate
   ```

2. Install the web dependencies.

   ```bash
   cd web
   npm ci
   cd ..
   ```

3. Copy the available environment templates, then replace placeholder values.

   ```bash
   cp api/.env.example api/.env
   cp web/.env.example web/.env.local
   ```

   - Create the worker configuration at:

     ```text
     worker-python/.env
     ```

   - Follow the [worker setup guide](worker-python/README.md) for its required configuration.

4. Confirm the web app can build.

   ```bash
   cd web
   npm run build
   cd ..
   ```

---

## Usage

Run the API and web app in separate terminals. Worker commands are optional for local frontend development when existing service data is available.

```bash
# terminal 1: API, port 8000
cd api
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# terminal 2: web app, port 3001
cd web
npm run dev

# worker default: run both services inside the configured time window
cd worker-python
source venv/bin/activate
python src/main.py

# worker options
python src/main.py --run-anyway   # run both services outside the time window
python src/main.py --run-logbook  # generate only the activity summary
python src/main.py --run-toggl    # refresh only the project-time CSV

# recommended first manual worker run
python src/main.py --run-anyway

# refresh the worker's temporary logbook input before summarizing
python scripts/sync_logbook.py

# production web start after a successful build
cd web
npm start
```

Local URLs:

```text
http://localhost:3001
http://localhost:8000/docs
http://localhost:8000/redoc
```

- The API initializes its SQLite tables and admin user during startup.
- Worker outputs are written under the configured project resources directory:

  ```text
  services-data/logbook-7-day-summary.json
  services-data/project_time_entries.csv
  ```

- Worker exit codes are `0` for success, `1` for an operational error, and `2` when the time guardrail blocks a default run.
- The combined worker runs Toggl first. If Toggl fails, the logbook flow continues using any existing CSV data and the process returns the Toggl failure code after the summary succeeds.

Edit the relevant package, rerun its command or build, and refresh the web app to compare the result.

---

## Project Structure

```text
PersonalWeb03/
├── api/                 # FastAPI backend, database, blog, and downloads
│   ├── docs/            # API reference material
│   └── src/             # Application code and route handlers
├── web/                 # Next.js website and admin interface
│   ├── docs/            # Frontend and integration references
│   ├── public/          # Static browser assets
│   └── src/             # App Router pages and React components
├── worker-python/       # Scheduled activity and Toggl data jobs
│   ├── docs/            # Worker operational notes
│   ├── scripts/         # Operator-run data synchronization tools
│   ├── src/             # Worker services and CLI entry point
│   └── tests/           # Worker unit tests
└── docs/                # Shared plans, images, and reference files
```

---

## References

- [API setup and operation](api/README.md)
- [Frontend setup and operation](web/README.md)
- [Worker setup and operation](worker-python/README.md)
- [API endpoint reference](api/docs/API_REFERENCE.md)
- [Worker development and troubleshooting notes](worker-python/docs/DEVELOPMENT_NOTES.md)
