# AGENT.md

This repository is a monorepo for PersonalWeb03. Start with the root `README.md` for the high-level layout, then read the nearest project-level `AGENT.md` before making changes inside a subproject.

## Repository Layout

1. `api/`
   - FastAPI backend for authentication, blog management, downloads, and homepage data.
   - Read `api/AGENT.md` before editing backend code.
2. `web/`
   - Next.js frontend for the personal website and admin pages.
   - Read `web/AGENT.md` before editing frontend code.
3. `cron-services-python/`
   - Python scheduled services that generate data files used by the site.
   - Read `cron-services-python/AGENT.md` before editing service code.
4. `docs/`
   - Shared images and reference material for the repository.

## Working Rules

1. Keep changes scoped to the relevant package unless the task clearly crosses package boundaries.
2. When changing shared data shapes or file outputs, check all consumers across `api/`, `web/`, and `cron-services-python/`.
3. Prefer the current source code over older notes if documentation and implementation disagree.
4. Treat local `.env` files, tokens, and generated service outputs as sensitive.
5. Do not rename top-level packages or move files between packages unless the task explicitly requires a monorepo restructuring.

## Practical Workflow

1. Identify which package owns the task.
2. Read that package's `README.md` and `AGENT.md`.
3. Make the smallest change that solves the problem.
4. Run the lightest relevant verification for the package you touched.
5. Summarize any cross-package impact in the final handoff.
