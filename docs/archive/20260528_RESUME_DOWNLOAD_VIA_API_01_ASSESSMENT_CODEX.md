---
created_at: 2026-05-29
updated_at: 2026-05-29
created_by: codex (gpt-5)
modified_by: codex (gpt-5)
---

# Resume Download via API Plan 01 Assessment Codex

The plan is good overall. It matches the current repo shape: `ResumeSection` has one static PDF link, the API already includes `/downloads/{filename}`, and `api/src/main.py` creates the `PATH_PROJECT_RESOURCES/downloadable/` directory on startup. I would proceed with the plan after tightening the operational pieces below.

## Assessment

1. Good plan, with one important dependency
   - Moving the resume behind the API is a reasonable simplification because it removes the duplicate static copy in `web/public/`.
   - The API route already has filename validation, file existence checks, and path containment checks.
   - The change is small and scoped: one frontend link, one deleted static file, and a server-side file placement step.
   - The plan depends on the API host having the resume file in a non-repo resource directory. That is acceptable, but it needs to be treated as a deployment asset, not an informal manual copy.

2. Moderate issue: production file management is under-specified
   - The plan says to copy `resumeNRodriguez.pdf` to `${PATH_PROJECT_RESOURCES}/downloadable/` in production before shipping the web change.
   - That prevents the immediate 404, but it does not define how the file survives server rebuilds, migrations, backup restores, or new host provisioning.
   - Recommended fix: add a short deployment note or runbook entry that identifies the production `PATH_PROJECT_RESOURCES` location, confirms it is backed up or persistent, and names the resume file as a required downloadable asset.

3. Moderate issue: production URL and protocol must be confirmed
   - The frontend will build the resume URL from `NEXT_PUBLIC_API_BASE_URL`.
   - If the site is served over HTTPS and `NEXT_PUBLIC_API_BASE_URL` points to an HTTP API URL, browsers may block or warn on the download as mixed content.
   - Recommended fix: add a preflight check that production `NEXT_PUBLIC_API_BASE_URL` is the public HTTPS API origin before the web deployment.

4. Moderate issue: the smoke test may be too narrow
   - `curl -I http://localhost:8000/downloads/resumeNRodriguez.pdf` only verifies response headers if the route handles `HEAD` correctly.
   - The actual user flow is a `GET` navigation from the browser.
   - Recommended fix: keep the header check if it works, but add a `GET` check that writes to a temp file and confirms it is a PDF, for example:

```bash
curl -fL http://localhost:8000/downloads/resumeNRodriguez.pdf -o /tmp/resumeNRodriguez.pdf
file /tmp/resumeNRodriguez.pdf
```

5. Moderate issue: the rollback path should be explicit
   - Once `web/public/resumeNRodriguez.pdf` is deleted, a broken API download cannot be masked by the frontend.
   - Recommended fix: include rollback instructions: either restore the static PDF link and file, or keep the API-hosted file in place and redeploy only if the API origin is wrong.

## Not problems

1. CORS
   - The plan is right that CORS is not a blocker for a normal anchor navigation.

2. API endpoint reuse
   - Reusing `/downloads/{filename}` is appropriate. A new route is not needed for this change.

3. MIME type
   - `application/octet-stream` is acceptable for a button labeled "Download PDF" because the desired behavior is a download, not inline preview.

4. Hard-coded filename
   - Keeping `resumeNRodriguez.pdf` inline in `ResumeSection` is fine because it is currently a single-use value.

## Recommended plan adjustment

1. Add production preflight items before the web change:
   - Confirm `NEXT_PUBLIC_API_BASE_URL` is the public HTTPS API origin.
   - Confirm `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` exists on the API host.
   - Confirm the resource directory is persistent or backed up.

2. Expand verification:
   - Test the API with a real `GET`.
   - Test the button in the browser after deployment.
   - Confirm the downloaded file opens as a PDF and is the expected resume version.

3. Add rollback notes:
   - Restore the static file and static link if the API-hosted file cannot be made reliable quickly.
   - Otherwise fix the API base URL or restore the missing server-side file, then retest the button.

## Bottom line

This is a solid plan for the code change. The main risk is not the implementation; it is treating the resume PDF as an out-of-repo production asset without enough deployment and persistence detail. Add those checks, and the plan is ready to execute.
