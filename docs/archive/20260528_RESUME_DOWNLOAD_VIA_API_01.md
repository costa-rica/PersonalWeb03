---
created_at: 2026-05-28
updated_at: 2026-05-28
created_by: claude (opus-4.7)
modified_by: claude (opus-4.7)
---

# Resume Download via API Plan 01

Switch the "Download PDF" button in `ResumeSection` from serving `resumeNRodriguez.pdf` out of `web/public/` to serving it from the API's existing downloads endpoint, which reads from `PATH_PROJECT_RESOURCES/downloadable/`.

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

## Plan

### Phase 1 — Server-side prerequisites

- [ ] Confirm `PATH_PROJECT_RESOURCES` is set in `api/.env` for local dev and that `${PATH_PROJECT_RESOURCES}/downloadable/` exists.
- [ ] Copy the current `web/public/resumeNRodriguez.pdf` to `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` on the local dev machine.
- [ ] Repeat the copy on the production server (or whichever host serves the API in prod) before the web change ships, so the link does not 404 between deploys.
- [ ] Smoke test directly against the API: `curl -I http://localhost:8000/downloads/resumeNRodriguez.pdf` returns 200 with a `content-disposition: attachment; filename="resumeNRodriguez.pdf"` header.

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

## Risks & considerations

- **Deploy ordering**: if the web change ships before the file exists in `downloadable/` on the API host, the button 404s. Do Phase 1 on prod first, then deploy Phase 2 + 3 together.
- **CORS**: the link is a top-level navigation (anchor with `target="_blank"`), not a fetch, so CORS does not apply. No API change needed.
- **Caching**: Next.js was serving the PDF with its static-asset caching. FastAPI's `FileResponse` does not set aggressive cache headers. For a resume this is fine — the file is small and downloaded rarely — but worth noting if traffic grows.
- **Filename in download**: `FileResponse(filename=filename)` sets `Content-Disposition: attachment; filename="resumeNRodriguez.pdf"`, so the saved file name matches what users see today.
- **MIME type**: the API returns `application/octet-stream`. Some browsers will save instead of preview; this is acceptable and arguably preferable for a "Download PDF" button. If we want in-browser PDF preview, the API would need a small change to send `application/pdf` for `.pdf` files — out of scope here.
- **Local dev parity**: anyone running the web app locally without the API running will see a broken link. Document in the commit message; no code workaround needed.

## Test plan

- [ ] With API and web both running locally, click "Download PDF" on the resume section. Browser downloads `resumeNRodriguez.pdf` matching the file in `${PATH_PROJECT_RESOURCES}/downloadable/`.
- [ ] Replace the file at `${PATH_PROJECT_RESOURCES}/downloadable/resumeNRodriguez.pdf` with a modified PDF, hard-refresh, click again — new file downloads without a web rebuild.
- [ ] Confirm `web/public/resumeNRodriguez.pdf` is gone and `npm run build` still succeeds.
- [ ] On prod, after the file is staged and the web change is deployed, click the button and verify the download.
