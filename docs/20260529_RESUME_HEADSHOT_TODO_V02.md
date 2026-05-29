---
created_at: 2026-05-29
updated_at: 2026-05-29
created_by: claude (opus-4.7)
modified_by: claude (opus-4.7)
---

# Resume Headshot TODO V02

Task list derived from [20260529_RESUME_HEADSHOT_PLAN_V02.md](20260529_RESUME_HEADSHOT_PLAN_V02.md). Follow phases in order. After each phase, run the verification steps listed at the end of the phase, fix any failures, then check off completed tasks and commit changes scoped to that phase.

## Changes from V01

Codex's TODO V01 assessment correctly flagged that V01's Phase 2 import instructions were inaccurate:

- `web/src/components/ResumeSection.tsx` currently has **no React import at all** — V01's "add `useState` to the existing React import" is misleading because there is no existing React import to add to.
- `HeroSection.tsx` imports `ModalDisplayPicture` with a **relative** path (`./ModalDisplayPicture`), not the alias path (`@/components/ModalDisplayPicture`) V01 suggested as "matching" it.
- V01 told the implementer to use `next/image`'s `<Image>` but never explicitly listed the `Image` import line.

V02 rewrites the Phase 2 import instructions to list the exact import lines to add, and preserves the rest of V01 unchanged.

Authoritative references:

- Plan: `docs/20260529_RESUME_HEADSHOT_PLAN_V02.md`
- Web conventions: `web/AGENTS.md`
- Repo conventions (frontmatter, commit messages): `AGENTS.md`

Implementation defaults from the plan:

- Use **Option A** (two assets) unless the operator directs otherwise. Option B (single asset + CSS zoom-and-clip) is documented in the plan if needed.
- Filenames: `headshotNRodriguez.jpg` (full) and `headshotNRodriguezCrop.jpg` (thumbnail).
- Desktop thumbnail size: ~160px square (`w-40 h-40`).

## Phase 1 — Asset preparation

Goal: place the full original image and a head-and-shoulders crop under `web/public/` so the web build can serve both.

- [ ] Confirm the source asset exists at `/home/nick/.hermes/image_cache/img_52f85da30cd1.jpg` (JPEG, 800x800). If missing, stop and ask the operator.
- [ ] Copy the source byte-for-byte to `web/public/headshotNRodriguez.jpg` (used by the modal — must remain unmodified).
- [ ] Produce a head-and-shoulders crop and save to `web/public/headshotNRodriguezCrop.jpg`:
  - Aspect ratio 1:1, recommended output 400x400.
  - Framing: top of head near the top of the frame with a small margin; shoulders fully visible across the bottom edge; subject centered horizontally.
  - Reference command from the plan (adjust offsets visually as needed):

    ```bash
    magick /home/nick/.hermes/image_cache/img_52f85da30cd1.jpg \
      -gravity north -crop 800x400+0+40 +repage \
      -resize 400x400^ -gravity center -extent 400x400 \
      web/public/headshotNRodriguezCrop.jpg
    ```

- [ ] Visually open both files and confirm:
  - `headshotNRodriguez.jpg` is the full original (no edits).
  - `headshotNRodriguezCrop.jpg` is a standard professional head-and-shoulders framing (no torso, no full body, no awkward face cut-off).
- [ ] Re-crop if the framing is off. The exact offsets are not load-bearing; the visual result is.

### Phase 1 verification

- [ ] `ls web/public/headshotNRodriguez.jpg web/public/headshotNRodriguezCrop.jpg` both exist.
- [ ] `file web/public/headshotNRodriguez.jpg` and `file web/public/headshotNRodriguezCrop.jpg` both report JPEG image data.
- [ ] No lint / build run required for an asset-only change. Do NOT commit yet — bundle the asset commit with the Phase 2 code change so the build stays bisectable, OR commit assets separately as a `chore:` commit if the operator prefers smaller commits. Default: bundle with Phase 2.

## Phase 2 — `ResumeSection.tsx` changes

Goal: render the cropped thumbnail to the left of the name block, wire it to `ModalDisplayPicture` showing the full original.

Edit [web/src/components/ResumeSection.tsx](../web/src/components/ResumeSection.tsx):

- [ ] Add the following three imports at the top of the file, alongside the existing `next/link` and `lucide-react` imports (the file currently has **no React import and no `next/image` import**; do not assume one exists):

  ```ts
  import { useState } from "react";
  import Image from "next/image";
  import ModalDisplayPicture from "./ModalDisplayPicture";
  ```

  Note on the `ModalDisplayPicture` import path: use the **relative** path `./ModalDisplayPicture` to match the existing usage in `HeroSection.tsx` (which is the only other consumer of this component). Do not use the `@/components/ModalDisplayPicture` alias here — the goal is consistency with the sibling component in the same directory.

- [ ] Add modal state inside the component:

  ```ts
  const [isHeadshotModalOpen, setIsHeadshotModalOpen] = useState(false);
  ```

- [ ] Restructure the "Top Personal Info Section" left column (current `flex flex-col lg:flex-row gap-6 mb-8` container around lines 115–195) so the headshot sits to the left of the name / title / objective stack:
  - On `lg` and up: a `flex-row` wrapper with the headshot first (fixed `w-40` square) and the existing text stack (`flex-1`) second.
  - On small screens: `flex-col` so the headshot stacks above the name block. Preserve the existing `flex-col sm:flex-row items-start sm:items-center gap-4` row that holds the name + Download PDF button.
  - Right-hand contact column unchanged.
  - Download PDF button placement unchanged.
- [ ] Add the thumbnail trigger inside the new left wrapper:

  ```tsx
  <button
    type="button"
    onClick={() => setIsHeadshotModalOpen(true)}
    aria-label="Open headshot"
    className="cursor-pointer transition-opacity hover:opacity-95"
  >
    <Image
      src="/headshotNRodriguezCrop.jpg"
      alt="Nick Rodriguez headshot"
      width={160}
      height={160}
      className="w-40 h-40 object-cover rounded-lg border-2 border-black"
    />
  </button>
  ```

  - Uses `next/image`'s `<Image>` (imported above).
  - Do NOT set `priority` (this section is below the fold; keep the hero portrait's priority slot).
- [ ] Render `<ModalDisplayPicture />` near the bottom of the returned JSX (outside the layout flex containers but inside the section root, matching `HeroSection.tsx`'s usage around lines 228–233):

  ```tsx
  <ModalDisplayPicture
    isOpen={isHeadshotModalOpen}
    onClose={() => setIsHeadshotModalOpen(false)}
    src="/headshotNRodriguez.jpg"
    alt="Nick Rodriguez headshot"
  />
  ```

  - The modal `src` is **always** the uncropped original `/headshotNRodriguez.jpg`.
- [ ] Do not introduce a constant, helper, or new shared component for the headshot. Keep paths inline.
- [ ] Do not modify the existing Download PDF button, contact column, or any other resume content.

### Phase 2 verification

Run from `web/`:

- [ ] `npm run lint` — must pass with no new warnings (watch for unused imports and a11y on the button).
- [ ] `npm run build` — must succeed. (`next.config.mjs` has `ignoreBuildErrors: true` for TS per `web/AGENTS.md`, so lint is the stronger TS signal; the build should still complete cleanly.)
- [ ] No automated test suite is configured for `web/` per `web/AGENTS.md`. Skip test execution unless one has been added since.
- [ ] Manual browser smoke test with `npm run dev`:
  - [ ] Resume section renders the cropped thumbnail to the left of the name on desktop widths.
  - [ ] The visible thumbnail shows head and shoulders only — no torso, no full body, no awkward face cut-off.
  - [ ] On narrow widths the layout stacks without overlap or overflow.
  - [ ] Clicking the thumbnail opens `ModalDisplayPicture` at ~90vw × 90vh and shows the **full uncropped original**.
  - [ ] Escape and backdrop click both close the modal; body scroll is restored after close.
  - [ ] Keyboard: Tab to the thumbnail, press Enter / Space to open the modal; Escape closes.
  - [ ] Hero portrait modal still works (regression check — both sections use `ModalDisplayPicture` independently).
- [ ] If no browser is available on the host running the agent, mark the manual checks as deferred and surface that explicitly in the final handoff. Do NOT claim success without visual verification.
- [ ] Check off the completed Phase 1 + Phase 2 tasks and commit. Use an `ideal` `feat:` commit per `AGENTS.md` (title ≤ 50 chars, e.g. `feat: add clickable headshot to resume section`). The body should:
  - reference this TODO file and the phases covered,
  - note both `web/public/headshotNRodriguez.jpg` (full) and `web/public/headshotNRodriguezCrop.jpg` (thumbnail) are committed,
  - append the `co-authored-by:` line(s) for the implementing agent(s) per `AGENTS.md`.

## Out of scope (do not implement)

- No API or backend changes. The resume PDF download endpoint is untouched.
- No new shared component; reuse `ModalDisplayPicture` as-is.
- No automated tests added (no frontend test harness configured).
- No image-optimization pipeline change (`unoptimized: true` stays).
- No focus-return-to-trigger behavior after modal close (nice-to-have, deferred).
