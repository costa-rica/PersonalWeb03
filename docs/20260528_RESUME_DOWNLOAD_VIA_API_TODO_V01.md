---
created_at: 2026-05-29
updated_at: 2026-05-29
created_by: claude (opus-4.7)
modified_by: codex (gpt-5)
---

# Resume Download via API TODO V01

Task list derived from [20260528_RESUME_DOWNLOAD_VIA_API_PLAN_V02.md](20260528_RESUME_DOWNLOAD_VIA_API_PLAN_V02.md). Follow phases in order. After each phase, run the verification steps listed at the end of the phase, fix any failures, then check off completed tasks and commit changes scoped to that phase.

Authoritative references:

- Plan: `docs/20260528_RESUME_DOWNLOAD_VIA_API_PLAN_V02.md`
- API conventions: `api/AGENTS.md`
- Web conventions: `web/AGENTS.md`
- Repo conventions (frontmatter, commit messages): `AGENTS.md`

## Phase 1 — Server-side prerequisites (local dev)

Goal: confirm the API can serve `resumeNRodriguez.pdf` from `${PATH_PROJECT_RESOURCES}/downloadable/` on the local dev machine.

- [x] In `api/.env`, confirm `PATH_PROJECT_RESOURCES` is set and points at a real absolute path.
- [x] Confirm `${PATH_PROJECT_RESOURCES}/downloadable/` exists on disk. (`api/src/main.py` creates it on startup; start the API once if needed to materialize it.)
- [x] Copy the current `web/public/resumeNRodriguez.pdf` to `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` on the local dev machine. Do not delete the `web/public/` copy yet — Phase 3 handles deletion.
- [x] Keep a separate copy of the resume PDF outside the repo (e.g., in `~/` or a backup folder) so rollback never depends solely on git history.

### Phase 1 verification (local dev)

- [ ] Start the API: `uvicorn src.main:app --reload` from `api/` using the project venv (`which python` confirms venv, per `AGENTS.md`).
- [ ] Run the `GET`-based smoke test from the plan and confirm a real PDF is returned:

  ```bash
  curl -fL http://localhost:8000/downloads/resumeNRodriguez.pdf -o /tmp/resumeNRodriguez.pdf
  file /tmp/resumeNRodriguez.pdf   # expect: "PDF document, version 1.x"
  ```

- [ ] If `file` does not report a PDF, stop and resolve before continuing (most likely: wrong `PATH_PROJECT_RESOURCES`, missing file, or a 404 body written to the output file by curl without `-f`).

Note: port 8000 was already occupied on this host by another local service, so the API could not bind to the exact default command above. The same venv-backed API was started on port 8010 and the `GET` smoke test returned a PDF from `http://localhost:8010/downloads/resumeNRodriguez.pdf`.

This phase is server-side configuration and has no code changes, so no lint / type / build run is required. Do not commit anything in this phase (no repo files change).

## Phase 2 — Production preflight (run before deploying the web change)

Goal: confirm production has the prerequisites the web change will rely on. This phase is operational only — no repo edits except optional documentation in the last task.

- [ ] Confirm the production `NEXT_PUBLIC_API_BASE_URL` baked into the web build is the **public HTTPS** API origin. If the site is HTTPS and this value is an `http://` URL, browsers will block the download as mixed content. Resolve before deploy.
- [ ] Confirm `${PATH_PROJECT_RESOURCES}` on the production API host points at a **persistent** location: it survives container/server rebuilds, OS reinstalls, and is included in whatever backup the host already runs. If not, fix persistence before placing the file.
- [ ] Place `resumeNRodriguez.pdf` at `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` on the production API host.
- [ ] Verify against the public API URL:

  ```bash
  curl -fL https://<prod-api>/downloads/resumeNRodriguez.pdf -o /tmp/r.pdf
  file /tmp/r.pdf   # expect: "PDF document, version 1.x"
  ```

- [x] Record `resumeNRodriguez.pdf` as a **required downloadable asset** in whatever deployment/runbook doc the project maintains for `PATH_PROJECT_RESOURCES` contents. If no such doc exists, add a short note to `api/README.md` (or a new file under `docs/references/`) listing the expected contents of `PATH_PROJECT_RESOURCES/downloadable/`.

### Phase 2 verification

- [ ] Production `curl ... | file` reports a PDF.
- [x] If a documentation file was edited or added in the last task above, commit it as a `docs:` commit per the format in `AGENTS.md` ("Commit Message Guidance"). No lint / type / test / build run is required for a docs-only commit, but if `web/` or `api/` source files were touched as part of staging the docs, run the relevant package's lint/test/build before committing.

## Phase 3 — Web change

Goal: switch `ResumeSection` from the static `/resumeNRodriguez.pdf` path to the API-hosted URL.

- [x] Edit [web/src/components/ResumeSection.tsx](../web/src/components/ResumeSection.tsx) (link is at line 118 in the current revision):
  - [x] At the top of the component (matching the pattern used in `HeroSection.tsx`, `BlogSection.tsx`, `MarkdownRenderer.tsx`, `web/src/app/blog/[id]/page.tsx`, and `web/src/lib/api/admin.ts`), read the base URL:

    ```ts
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    ```

  - [x] Change the `Download PDF` `<Link>`'s `href` from `/resumeNRodriguez.pdf` to `` `${API_BASE_URL}/downloads/resumeNRodriguez.pdf` ``.
  - [x] Keep `target="_blank"`.
  - [x] Add `rel="noopener noreferrer"` to match the other external links in this component.
  - [x] Add the `download` attribute as belt-and-suspenders (API already sets `Content-Disposition: attachment`).
- [x] Keep the filename inline at the call site — do not introduce a constant or helper. (The plan explicitly prefers no indirection for a single-use string.)
- [x] Confirm no other code in `web/` references `/resumeNRodriguez.pdf` (a grep should show only `ResumeSection.tsx`). If any other reference exists, surface it before proceeding.

### Phase 3 verification (web)

Run from `web/`:

- [x] `npm run lint` — fix any new warnings or errors introduced by the edit.
- [x] `npm run build` — must succeed. (Note: `next.config.mjs` sets `ignoreBuildErrors: true` for TypeScript per `web/AGENTS.md`; still ensure the build completes cleanly.)
- [x] No automated test suite is configured for `web/` in `web/AGENTS.md`. Skip test execution unless one has been added since.
- [ ] Manual smoke test with API + web running locally: click "Download PDF" in the resume section. Browser downloads `resumeNRodriguez.pdf`. Open the downloaded file and confirm it renders as the expected resume.
- [ ] Replace `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` with a modified PDF, hard-refresh, click again — the new file downloads without rebuilding the web app. Restore the original file after this check.
- [x] Check off the Phase 3 tasks and commit. Use an `ideal` `feat:` commit per `AGENTS.md`. Title ≤ 50 chars (e.g., `feat: serve resume via api downloads endpoint`). Body should reference this TODO file and Phase 3, and note that the resume must exist at `PATH_PROJECT_RESOURCES/downloadable/resumeNRodriguez.pdf` on every host running the API. Append the `co-authored-by:` line for the implementing agent.

Note: no browser binary is available on this host, so the browser-click smoke checks remain unchecked. The local web server was run with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8010`, the dev bundle contained the API download URL, the API download returned a PDF, and a temporary PDF swap in `PATH_PROJECT_RESOURCES/downloadable/` was served without rebuilding before the original file was restored.

## Phase 4 — Clean up the static copy

Goal: remove the now-duplicate static PDF and any stale documentation references.

- [ ] Confirm a non-repo backup of the resume PDF still exists (from Phase 1) and that the production API is serving the file (from Phase 2). Do NOT proceed if either is missing — the static file is the only remaining fallback until both are true.
- [ ] Delete `web/public/resumeNRodriguez.pdf` from the repo.
- [ ] Re-check `web/AGENTS.md` for any specific mention of the resume PDF as a public asset. The current text only says "Static assets stored in `/public`" generically, so likely no edit is needed. If a specific resume reference exists, remove it.

### Phase 4 verification (web)

Run from `web/`:

- [ ] `npm run lint` — must pass.
- [ ] `npm run build` — must succeed with the static PDF removed.
- [ ] Manual smoke test (local): with API + web running, click "Download PDF" and confirm the file still downloads (now exclusively via the API). Open it and confirm it is the expected resume.
- [ ] Check off the Phase 4 tasks and commit. Use a `chore:` (or `refactor:`) commit per `AGENTS.md` with a short body noting the static copy is removed and the canonical file now lives at `PATH_PROJECT_RESOURCES/downloadable/resumeNRodriguez.pdf`. Append the `co-authored-by:` line.

## Phase 5 — Production verification

Goal: confirm the deployed change works end-to-end against the live API.

- [ ] Deploy the web change to production (per the project's normal deploy process — outside the scope of this TODO).
- [ ] Against the production API: `curl -fL https://<prod-api>/downloads/resumeNRodriguez.pdf -o /tmp/r.pdf && file /tmp/r.pdf` reports a PDF.
- [ ] In a real browser on the production site: click "Download PDF". Confirm no mixed-content warning, the file downloads, opens as a PDF, and is the expected resume version.
- [ ] If anything fails, follow the Rollback section of `docs/20260528_RESUME_DOWNLOAD_VIA_API_PLAN_V02.md` (fast path first; full rollback via `git checkout <pre-change-sha> -- web/public/resumeNRodriguez.pdf` and reverting the `ResumeSection.tsx` edit only if the fast path is not viable).

This phase has no repo edits unless rollback is triggered; in that case, re-run the relevant package's lint/build before committing the revert.
