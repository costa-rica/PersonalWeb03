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

## Commit Message Guidance

### Guidelines

- Only generate the message for staged files/changes
- Title is lowercase, no period at the end.
- Title should be a clear summary, max 50 characters.
- Use the body to explain _why_ and the main areas changed, not just _what_.
- Bullet points should be concise and high-level.
- Try to use the ideal format. But if the commit is too broad or has too many different types, then use the broad format.
- When committing changes from TODO or task list that is already part of the repo and has phases, make reference to the file and phase instead of writing a long commit message.
- Add a commit body whenever the staged change is not trivially small.
- A body is expected when the commit:
  - touches more than 3 files
  - touches more than one package or app
  - includes both implementation and tests
  - adds a new route, component, workflow, or integration point
- For broader commits, the title can stay concise, but the body should summarize the main change areas so a reader can understand scope without opening the diff.
- Do not use the body as a file inventory. Summarize the logical changes in 2-5 bullets.

### Format

#### Ideal Format

```
<type>:<space><message title>

<bullet points summarizing what was updated>
```

#### Broad Format

```
<message title>

<bullet points summarizing what was updated>
```

#### Types for Ideal Format

| Type     | Description                           |
| -------- | ------------------------------------- |
| feat     | New feature                           |
| fix      | Bug fix                               |
| chore    | Maintenance (e.g., tooling, deps)     |
| docs     | Documentation changes                 |
| refactor | Code restructure (no behavior change) |
| test     | Adding or refactoring tests           |
| style    | Code formatting (no logic change)     |
| perf     | Performance improvements              |
