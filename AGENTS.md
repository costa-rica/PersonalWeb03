# AGENTS.md

This repository is a monorepo for PersonalWeb03. Start with the root `README.md` for the high-level layout, then read the nearest project-level `AGENTS.md` before making changes inside a subproject.

## Python

When running Python, use the venv in the project. Do not use the system environment. Before running Python commands, verify the active interpreter with `which python` and `python --version`.

## Repository Layout

1. `api/`
   - FastAPI backend for authentication, blog management, downloads, and homepage data.
   - Read `api/AGENTS.md` before editing backend code.
2. `web/`
   - Next.js frontend for the personal website and admin pages.
   - Read `web/AGENTS.md` before editing frontend code.
3. `worker-python/`
   - Python scheduled services that generate data files used by the site.
   - Read `worker-python/AGENTS.md` before editing service code.
4. `docs/`
   - Shared images and reference material for the repository.

## Working Rules

1. Keep changes scoped to the relevant package unless the task clearly crosses package boundaries.
2. When changing shared data shapes or file outputs, check all consumers across `api/`, `web/`, and `worker-python/`.
3. Prefer the current source code over older notes if documentation and implementation disagree.
4. Treat local `.env` files, tokens, and generated service outputs as sensitive.
5. Do not rename top-level packages or move files between packages unless the task explicitly requires a monorepo restructuring.

## Practical Workflow

1. Identify which package owns the task.
2. Read that package's `README.md` and `AGENTS.md`.
3. Make the smallest change that solves the problem.
4. Run the lightest relevant verification for the package you touched.
5. Summarize any cross-package impact in the final handoff.

## Creating Markdown Files in docs/

### Filenames

The default naming pattern should be

- prefix date using the `YYYYMMDD_` format
- descriptive name in all caps
- use "\_" in place of spaces

### YAML frontmatter

Every generated `.md` file will begin with a YAML frontmatter block delimited by `---` lines containing exactly these four keys:

```yaml
---
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
created_by: <agent name> (<model>)
modified_by: <agent name> (<model>)
---
```

Rules:

- `created_at` is set once, at file creation, and MUST NEVER be modified on later edits.
- `updated_at` is rewritten to today's date on every modification.
- `created_by` is set once, at file creation, and MUST NEVER be modified on later edits.
- `modified_by` is rewritten on every modification. On the very first write, set it to the same value as `created_by`.
- The `created_by` / `modified_by` value uses the format `<agent name> (<model>)`, lowercase only, with no email addresses and no angle brackets.

Acceptable examples:

```yaml
created_by: claude (sonnet-4)
created_by: claude (opus-4.7)
created_by: codex (gpt-5)
modified_by: claude (haiku-4.5)
```

## Human-readable documents

Treat these as strong operator preferences rather than strict requirements. If they conflict with a requested document structure, template, or established heading hierarchy, preserve the intended structure and adapt these preferences to fit.

- Use plain, human-readable language.
- Do not use bold text.
- Prefer bullets and numbering over long paragraphs.
- Keep each paragraph under 50 words.
- Multiple short paragraphs are acceptable.
- Keep sections focused and easy for the operator to scan and answer.

## Open questions created by agents

Use an open-questions section when the operator asks for one or when unresolved decisions would materially help the document.

- Make open questions the final section of the PRD, plan, or other agent-authored document.
- Use `## Open Questions` as the section heading.
- If the document's required structure uses different heading levels, adjust the hierarchy while preserving the pattern below.
- Give each question its own numbered `###` heading.
- Keep the numbered question heading description to 40 characters or fewer.
- Put the full question below its heading.
- Focus each question on one decision.
- Bullets are acceptable when they make choices or context easier to scan.
- Add a `#### Operator Response` subsection under every question.
- Leave the operator response empty unless an agent recommendation would be useful.
- When providing a recommendation, begin it with the agent's name in parentheses.
- Prefer recommendations under 30 words.
- Apply the human-readable document preferences to questions and recommendations.

Example:

```markdown
## Open Questions

### 1. Default date range

Should a report without dates cover the trailing seven days, including today?

#### Operator Response

(codex) Recommend the trailing seven days in the Toggl user timezone.
```

## Commit Message Guidance

### Guidelines

- Only generate the message for staged files/changes
- Title is lowercase, no period at the end.
- Title should be a clear summary, max 50 characters.
- Use the body to explain _why_ and the main areas changed, not just _what_.
- Bullet points should be concise and high-level.
- Try to use the ideal format. But if the commit is too broad or has too many different types, then use the borad format.
- When committing changes from TODO or task list that is already part of the repo and has phases, make refernce to the file and phase instead of writing a long commit message.
- Add a commit body whenever the staged change is not trivially small.
- A body is expected when the commit:
  - touches more than 3 files
  - touches more than one package or app
  - includes both implementation and tests
  - adds a new route, component, workflow, or integration point
- For broader commits, the title can stay concise, but the body should summarize the main change areas so a reader can understand scope without opening the diff.
- Do not use the body as a file inventory. Summarize the logical changes in 2-5 bullets.
- append co-authored-by line(s) at the end of the commit message
  - format: `co-authored-by: <agent name> (<model>)`
  - examples:
    - `co-authored-by: claude (sonnet-4)`
    - `co-authored-by: codex (gpt-5)`
- never include emails or angle brackets (`< >`)
- use lowercase only
- if multiple agents contributed, add one line per agent (no bullets, just separate lines)

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
