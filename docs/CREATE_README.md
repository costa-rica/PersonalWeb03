---
created_at: 2026-07-04
updated_at: 2026-07-14
created_by: claude (fable-5)
modified_by: claude (fable-5)
---

# Create README

> This playbook is referred to as `create-readme`. When the operator says "create-readme", follow this file.

## Overview

This playbook tells a coding agent how to create (or rewrite) a repository's root `README.md`. The README is written for a human operator — someone who needs to install, run, and navigate the project — not for an AI agent. Agent-facing guidance belongs in `AGENTS.md`, never in the README.

## Audience and tone

- Write for an operator: assume they can use a terminal but know nothing about this repo yet.
- Lean is the goal. Every line must help someone set up, run, or find something.
- Do not document internals, design rationale, or coding conventions.
- Do not duplicate content that lives in `docs/` — link to it in References instead.

## Formatting rules

These rules are strict:

1. No bold font anywhere in the README.
2. No section's prose may exceed 400 characters. If it does, convert it to bullets, a numbered list, or a subsection.
3. Prefer bullets, numbered steps, code blocks, and `###` subsections over paragraphs.
4. Separate top-level sections with a `---` horizontal rule.
5. Use fenced code blocks for all commands, ports, paths, and file trees.
6. Relative markdown links for anything inside the repo.

## YAML frontmatter

The README begins with the standard frontmatter block defined in the repo's `AGENTS.md`, delimited by `---` lines with exactly these four keys:

```yaml
---
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
created_by: <agent name> (<model>)
modified_by: <agent name> (<model>)
---
```

Rules:

- `created_at` and `created_by` are set once at file creation and never modified afterward.
- `updated_at` and `modified_by` are rewritten on every modification. On first write, `modified_by` equals `created_by`.
- Values are lowercase, format `<agent name> (<model>)`, no emails, no angle brackets. Example: `claude (sonnet-4)`.
- If the repo's `AGENTS.md` defines a different frontmatter convention, that file wins.

## Required structure

Produce the sections below, in this order. Omit a section only if it genuinely does not apply (e.g. no References yet). Do not add a `.env` section — environment variables are covered by each package's `.env.example`, and Setup may mention copying it, nothing more.

### 1. Header

- Optional logo image at the very top (e.g. `<img src="docs/images/logo.png" alt="..." width="220" />`).
- `# <RepoName>` as the H1.
- One or two plain sentences saying what the project is and its top-level shape (e.g. monorepo with which apps).

### 2. Project Overview

- Short description of what the system does end to end, under 400 characters.
- A `Stack:` line listing the main technologies, comma-separated.

### 3. Setup

- `Prerequisites:` bullet list — runtimes, databases, system tools, with versions and install hints where useful.
- Numbered install/build steps runnable from the repo root.
- One bullet noting where `.env` files live and to copy `.env.example` to `.env` in each package. Do not list variables.

### 4. Usage

First decide the section's shape from the number of operator-facing entry points:

- One script or service: write Usage as a single compact section following the command-block guidance below.
- Multiple scripts: split Usage into one `###` subsection per script, each following the command-block guidance below. Rules for subsections:
  - Name each subsection exactly after the script file, e.g. `### run_eval.py`.
  - Order by workflow importance: the primary entry point first, supporting scripts (reporting, post-processing, utilities) after.
  - The primary script's subsection opens directly with its command block — no intro sentence.
  - Each secondary script's subsection opens with one plain sentence saying what it does, then its command block.
  - Repeat the shell activation line at the top of every subsection's block so any subsection can be copied standalone.
  - Keep each script's bullets inside its own subsection. When scripts chain (one consumes another's output), say so in a bullet that names the other script.
  - Only include scripts an operator would run directly; skip internal helpers and modules invoked by other scripts.

Command-block guidance (applies to the single block, or to each subsection's block):

- Keep commands close together. Prefer one primary fenced `bash` block instead of scattering each command across separate prose and code blocks.
- Begin with any required activation or directory-change command, then show the default run command.
- Add an `# options` group immediately after the default. Show one complete command per supported operator-facing option, with short aligned inline comments explaining its effect.
- After the options, include the recommended first run and common follow-up workflows such as resume, retry, report-only, migration, seeding, or production start when they apply.
- Use placeholders such as `MODEL`, `PATH`, `RUN_DIR`, and `PORT` when the operator must supply a value. Explain how to obtain the value in the nearest `#` comment.
- Do not list flags that the current executable does not support. Verify every option against the manifest, help output, or source parser.
- For multiple services, keep their start commands in the same block and label each with a `#` comment containing the service name and port.
- Put browser URLs and essential first-run behavior after the command block as concise bullets.
- Follow the block with short bullets covering defaults, filtering or sampling behavior, output locations and files, resume/retry semantics, timing or cost expectations, and failure handling when relevant.
- End with one brief iteration sentence when the normal workflow is edit, rerun, and compare.

Use this general shape, omitting lines that do not apply:

```bash
# required shell setup
source .venv/bin/activate

# default run
python run.py

# options
python run.py --limit N       # restrict the work performed
python run.py --model MODEL   # choose the model
python run.py --input PATH    # choose an input file

# recommended first run
python run.py --limit 25

# continue or rebuild without repeating completed work
python run.py --resume RUN_DIR
python run.py --report-only RUN_DIR
```

The Usage section — or each script's subsection when there are several — should let an operator scan one compact area and answer:

1. What command should I run first?
2. What options can I change?
3. How do I continue or rerun the workflow?
4. Where does output go?
5. What filtering, timing, cost, or failure behavior should I expect?

### 5. Project Structure

- A single fenced code block containing a directory tree of the top two levels or so.
- Annotate lines with short `#` comments naming each area's purpose.
- Include only directories an operator would look in; skip `node_modules`, build output, and lockfiles.

### 6. References

- Bullet list of links to key docs in the repo: provisioning guides, sub-package READMEs, requirement/spec docs.
- Link text is descriptive, not the filename (e.g. `[Postgres provisioning guide](docs/...)`).

## Procedure

1. Read the repo: root `package.json` (or equivalent), workspace/package layout, existing docs, and any `AGENTS.md` files.
2. Verify commands before writing them — install, build, and start scripts must match what the manifests actually define.
3. Run the executable's help command when available and use it to build the consolidated Usage option list.
4. Draft the README following the structure and formatting rules above.
5. If a README already exists, preserve accurate content that fits the structure; drop agent-facing or stale material.
6. Reread the result and cut anything an operator does not need on day one.

## Checklist before finishing

- [ ] Frontmatter present and correct per `AGENTS.md`.
- [ ] No bold text anywhere.
- [ ] No prose block over 400 characters.
- [ ] No `.env` variable listing.
- [ ] All commands verified against the repo's manifests.
- [ ] Usage keeps the default, options, and common workflows together in one primary command block — one per `###` script subsection when the repo has multiple operator-facing scripts.
- [ ] Every documented option exists in the current CLI or manifest.
- [ ] Usage notes explain defaults, outputs, continuation behavior, and operational constraints when relevant.
- [ ] All relative links resolve to real files.
- [ ] Sections in the required order, separated by `---`.
