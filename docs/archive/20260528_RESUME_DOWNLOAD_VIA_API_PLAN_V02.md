---
created_at: 2026-05-29
updated_at: 2026-05-29
created_by: claude (opus-4.7)
modified_by: claude (opus-4.7)
---

# Resume Download via API Plan V02

Switch the "Download PDF" button in `ResumeSection` from serving `resumeNRodriguez.pdf` out of `web/public/` to serving it from the API's existing downloads endpoint, which reads from `PATH_PROJECT_RESOURCES/downloadable/`.

> **V02 changes vs V01:** added a Production preflight subsection under Phase 1 (HTTPS check, resource-directory persistence, resume treated as a tracked deployment asset); replaced the `HEAD`-based smoke test with a `GET`-based one that verifies the downloaded bytes are a PDF; added an explicit Rollback section. Core architecture and target state are unchanged. Filename adopts the canonical `_PLAN_V02` suffix from `docs/PLAN_AND_VET.md`.

## Why

- Resume content changes more often than the web bundle. Today, replacing the PDF requires editing `web/public/resumeNRodriguez.pdf` and redeploying the Next.js app. Moving the file behind the API means it can be swapped on the server without a frontend rebuild/redeploy.
- The API already exposes `GET /downloads/{filename}` ([api/src/routers/downloads.py](api/src/routers/downloads.py)) backed by `PATH_PROJECT_RESOURCES/downloadable/`, with traversal protection and `FileResponse`. No new endpoint is needed.
- Removes the duplication risk where `web/public/resumeNRodriguez.pdf` and `PATH_PROJECT_RESOURCES/downloadable/resumeNRodriguez.pdf` could drift.

## Current state

- Web: [web/src/components/ResumeSection.tsx:118](web/src/components/ResumeSection.tsx:118) renders `<Link href="/resumeNRodriguez.pdf" target="_blank">Download PDF</Link>`. Next.js serves it statically from [web/public/resumeNRodriguez.pdf](web/public/resumeNRodriguez.pdf).
- API: [api/src/routers/downloads.py](api/src/routers/downloads.py) serves any file under `PATH_PROJECT_RESOURCES/downloadable/` at `GET /downloads/{filename}` with `media_type="application/octet-stream"` and `filename=filename` in `FileResponse`, which produces a `Content-Disposition: attachment; filename="..."` header.
- Base URL: web components already read `process.env.NEXT_PUBLIC_API_BASE_URL` (with `http://localhost:8000` fallback) in [HeroSection.tsx](web/src/components/HeroSection.tsx), [BlogSection.tsx](web/src/components/BlogSection.tsx), [MarkdownRenderer.tsx](web/src/components/MarkdownRenderer.tsx), [blog/[id]/page.tsx](web/src/app/blog/[id]/page.tsx), and [lib/api/admin.ts](web/src/lib/api/admin.ts:1). Follow that pattern.

## Target state

- `ResumeSection` links to `${NEXT_PUBLIC_API_BASE_URL}/downloads/resumeNRodriguez.pdf`.
- `web/public/resumeNRodriguez.pdf` is removed from the repo.
- The canonical resume file lives at `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` on every environment where the API runs (local dev, prod).
- The resume PDF is treated as a tracked deployment asset, not an ad-hoc manual copy — its location, persistence guarantees, and replacement procedure are documented.

## Plan

### Phase 1 — Server-side prerequisites

#### Local dev

- [ ] Confirm `PATH_PROJECT_RESOURCES` is set in `api/.env` for local dev and that `${PATH_PROJECT_RESOURCES}/downloadable/` exists. (`api/src/main.py` creates the directory on startup, but verify before testing.)
- [ ] Copy the current `web/public/resumeNRodriguez.pdf` to `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` on the local dev machine.
- [ ] Smoke test via real `GET` (not `HEAD`), and confirm the downloaded bytes are an actual PDF:

  ```bash
  curl -fL http://localhost:8000/downloads/resumeNRodriguez.pdf -o /tmp/resumeNRodriguez.pdf
  file /tmp/resumeNRodriguez.pdf   # expect: "PDF document, version 1.x"
  ```

#### Production preflight (run before deploying the web change)

- [ ] Confirm the production `NEXT_PUBLIC_API_BASE_URL` baked into the web build is the **public HTTPS** API origin. If the site is served over HTTPS and this value points at an `http://` URL, the browser will block the download as mixed content. Resolve before deploy.
- [ ] Confirm `${PATH_PROJECT_RESOURCES}` on the production API host points at a **persistent** location — i.e., it survives container/server rebuilds, OS reinstalls, and is included in whatever backup the host already runs. If not, fix persistence before placing the file.
- [ ] Place `resumeNRodriguez.pdf` at `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` on the production API host. Verify with the same `curl -fL ... | file` check against the public API URL.
- [ ] Record `resumeNRodriguez.pdf` as a **required downloadable asset** in whatever deployment/runbook doc the project maintains for `PATH_PROJECT_RESOURCES` contents, so a new-host provisioning run knows to stage it. If no such doc exists, add a short note inside `api/README.md` or a new entry under `docs/references/` listing the expected contents of `PATH_PROJECT_RESOURCES/downloadable/`.

### Phase 2 — Web change

- [ ] Edit [web/src/components/ResumeSection.tsx:118](web/src/components/ResumeSection.tsx:118):
  - Read base URL the same way other components do:
    `const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";`
  - Change the `href` to `` `${API_BASE_URL}/downloads/resumeNRodriguez.pdf` ``.
  - Keep `target="_blank"`. Add `rel="noopener noreferrer"` for parity with the other external links in this component.
  - Optional: add `download` attribute so browsers that render PDFs inline still trigger a save. The API already sets `Content-Disposition: attachment`, so this is belt-and-suspenders.
- [ ] Decide whether to keep the filename hard-coded in the component or hoist it into a constant near the top. Recommendation: keep it inline — the filename is a single string used in one place, and a constant would only add indirection.
- [ ] Confirm no other code in `web/` references `/resumeNRodriguez.pdf`. (Initial grep shows only `ResumeSection.tsx`.)

### Phase 3 — Clean up the static copy

- [ ] Delete [web/public/resumeNRodriguez.pdf](web/public/resumeNRodriguez.pdf) from the repo.
- [ ] Update [web/AGENTS.md](web/AGENTS.md) if it documents the resume as a public asset (currently it only says "Static assets stored in `/public`" generically — likely no edit needed).
- [ ] Note in the commit body that the resume now lives in `PATH_PROJECT_RESOURCES/downloadable/` and must be copied there on each host running the API.

## Rollback

If the API-hosted download is broken after the web change deploys and cannot be fixed within the operator's tolerance window:

1. **Fast path — fix forward without rollback** (preferred when the failure is just a misconfigured URL or a missing server-side file):
   - If `NEXT_PUBLIC_API_BASE_URL` is wrong (HTTP vs HTTPS, wrong origin), correct it and redeploy the web app.
   - If `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` is missing on the API host, re-stage it from a local copy.
   - Re-run the verification: click the button in the browser, confirm the file downloads and opens as a PDF.

2. **Full rollback** (only if fast path is not viable):
   - Restore `web/public/resumeNRodriguez.pdf` from git history (`git checkout <pre-change-sha> -- web/public/resumeNRodriguez.pdf`).
   - Revert the `ResumeSection.tsx` edit so the `href` is `/resumeNRodriguez.pdf` again.
   - Redeploy the web app. The static link is now restored, independent of the API.

Keep a local copy of the current resume PDF outside the repo before deleting the file in Phase 3, so rollback step 2 never depends solely on git history.

## Risks & considerations

- **Deploy ordering**: if the web change ships before the file exists in `downloadable/` on the API host, the button 404s. Production preflight in Phase 1 must complete before Phase 2/3 deploy.
- **HTTPS / mixed content**: covered in Production preflight. Top-level navigation from an HTTPS page to an HTTP `Content-Disposition: attachment` resource is blocked by modern browsers without a visible UI prompt in most cases.
- **CORS**: the link is a top-level navigation (anchor with `target="_blank"`), not a fetch, so CORS does not apply. No API change needed.
- **Caching**: Next.js was serving the PDF with its static-asset caching. FastAPI's `FileResponse` does not set aggressive cache headers. For a resume this is fine — the file is small and downloaded rarely — but worth noting if traffic grows.
- **Filename in download**: `FileResponse(filename=filename)` sets `Content-Disposition: attachment; filename="resumeNRodriguez.pdf"`, so the saved file name matches what users see today.
- **MIME type**: the API returns `application/octet-stream`. Some browsers will save instead of preview; this is acceptable and arguably preferable for a "Download PDF" button. If we want in-browser PDF preview, the API would need a small change to send `application/pdf` for `.pdf` files — out of scope here.
- **Resource-directory persistence**: covered in Production preflight. The whole feature assumes `PATH_PROJECT_RESOURCES` is durable storage; if it is ephemeral on the prod host, the file vanishes on every rebuild and the button silently 404s.
- **Local dev parity**: anyone running the web app locally without the API running will see a broken link. Document in the commit message; no code workaround needed.

## Test plan

- [ ] With API and web both running locally, click "Download PDF" on the resume section. Browser downloads `resumeNRodriguez.pdf` matching the file in `${PATH_PROJECT_RESOURCES}/downloadable/`. Open the downloaded file and confirm it renders as the expected resume.
- [ ] Replace the file at `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` with a modified PDF, hard-refresh, click again — new file downloads without a web rebuild.
- [ ] Confirm `web/public/resumeNRodriguez.pdf` is gone and `npm run build` still succeeds.
- [ ] On prod, after the file is staged and the web change is deployed:
  - [ ] `curl -fL https://<prod-api>/downloads/resumeNRodriguez.pdf -o /tmp/r.pdf && file /tmp/r.pdf` returns a PDF.
  - [ ] Click the button in a real browser on the production site, confirm no mixed-content warning, confirm the file downloads and opens as a PDF, and confirm it is the expected resume version.
