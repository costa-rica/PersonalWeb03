---
created_at: 2026-05-29
updated_at: 2026-05-29
created_by: claude (opus-4.7)
modified_by: claude (opus-4.7)
---

# Resume Headshot Plan V01

## Goal

Add a clickable headshot to the top-left of the on-page resume in
`web/src/components/ResumeSection.tsx`, mirroring the layout used in the
downloadable PDF (`web/public/resumeNRodriguez.pdf`). The on-page thumbnail
shows only head and shoulders; clicking it opens a modal that displays the
full original image at 90% viewport width and height.

## Source asset

- Operator-supplied file: `/home/nick/.hermes/image_cache/img_52f85da30cd1.jpg`
  - Identified as JPEG (despite the operator's "png" description),
    `800x800`, baseline JFIF.
- Source file lives outside the repo and must be copied into the Next.js
  `web/public/` directory so it is served as a static asset alongside the
  existing `montmartre2021.jpg` portrait.

## Technology and reuse

- Next.js 16 App Router, React 19 client component (file already declares
  `"use client"`). No server-side changes required.
- `next/image` `<Image>` is used elsewhere in the project for portraits.
  Reuse it here (project's `next.config.mjs` already sets
  `images.unoptimized: true`, so no remote-loader work is needed).
- Reuse the existing `ModalDisplayPicture` component
  (`web/src/components/ModalDisplayPicture.tsx`). It already implements:
  - 90vw x 90vh container,
  - `object-contain` to show the full original image,
  - Escape-to-close, backdrop click to close, body-scroll lock.
- Reuse the `useState` + `onClick` modal-trigger pattern from
  `HeroSection.tsx` (lines 214-233) so behavior is consistent across
  sections.

## Asset placement strategy

Two viable approaches; the recommendation is Option A so that the assessing
agent can challenge it.

- **Option A (recommended) — single original asset, CSS crop for thumbnail.**
  - Copy the source image once to
    `web/public/headshotNRodriguez.jpg` (kebab/camel name aligned with the
    existing `resumeNRodriguez.pdf` asset).
  - Render the thumbnail with a fixed aspect ratio and
    `object-cover` + `object-top` so that only head and shoulders are
    visible. The modal renders the same file with `object-contain` to show
    the full image.
  - Pros: one asset, no extra build step, identical bytes between
    thumbnail and modal (browser-cache friendly), avoids divergence
    between cropped/full copies.
  - Cons: the "crop" is a CSS framing choice; if the source is reshot at
    a different composition, the thumbnail framing values
    (`aspect-ratio`, `object-position`) may need a tweak.

- **Option B — two assets (pre-cropped thumbnail + full original).**
  - Generate a head-and-shoulders crop (e.g. `headshotNRodriguez-crop.jpg`)
    plus the full-size `headshotNRodriguez.jpg` for the modal.
  - Pros: thumbnail download size is smaller; crop framing is locked in
    the asset itself.
  - Cons: requires an image-edit step outside the code change, two assets
    to keep in sync, and the operator's stated requirement is "the image
    shown is cropped" — Option A satisfies that visually without the
    extra asset.

Plan proceeds with Option A unless the assessing agent flags it.

## Layout changes in `ResumeSection.tsx`

Target the existing "Top Personal Info Section" block (currently the
`flex flex-col lg:flex-row gap-6 mb-8` container at lines 115-195).

- Restructure the left column so the headshot sits to the left of the
  name / title / objective stack, matching the PDF.
- Introduce a new wrapper inside the left column:
  - On `lg` and up: `flex-row` with the headshot first (fixed width, e.g.
    `w-32` or `w-40`) and the existing text stack (`flex-1`) second.
  - On small screens: stack vertically (`flex-col`) with the headshot
    centered or left-aligned above the name. This preserves current mobile
    readability and avoids squeezing the name beside a small image.
- Keep the right-hand contact column unchanged.
- Keep the existing `Download PDF` button placement next to the name.

### Thumbnail element

- Wrap the thumbnail in a `<button>` (or a div with
  `role="button"`, `tabIndex={0}`, keydown handler) so it is keyboard
  focusable and announced as interactive.
- Use `next/image`'s `<Image>` with:
  - `src="/headshotNRodriguez.jpg"`,
  - `alt="Nick Rodriguez headshot"` (descriptive, non-decorative),
  - `width`/`height` matching the rendered box (e.g. 160x160) and
    `className="object-cover object-top rounded-lg border-2 border-black"`,
  - `priority` is **not** required (this section is below the fold);
    omit it so the hero portrait keeps the priority slot.
- Add cursor and hover affordances mirroring the hero portrait:
  `cursor-pointer transition-opacity hover:opacity-95`.

### Modal trigger state

- Add `const [isHeadshotModalOpen, setIsHeadshotModalOpen] = useState(false);`
  to `ResumeSection`. The component already runs as a client component,
  but it does not currently import `useState` — that import needs to be
  added.
- Render `<ModalDisplayPicture isOpen={isHeadshotModalOpen} onClose={...}
  src="/headshotNRodriguez.jpg" alt="Nick Rodriguez headshot" />` near the
  bottom of the returned JSX (outside the layout flex containers but inside
  the section root, matching `HeroSection` usage at lines 228-233).

## Responsive behavior

- Desktop (`lg` and up): headshot ~160px square to the left of the name /
  title / objective stack; right-hand contact column unchanged.
- Tablet / small: headshot stacks above the name block, capped (e.g.
  `w-32`) and either centered or left-aligned; the existing
  `flex-col sm:flex-row items-start sm:items-center gap-4` row holding
  name + download button is preserved.
- The image's intrinsic aspect ratio is 1:1 (800x800). The thumbnail box
  should use a 1:1 aspect ratio so `object-cover object-top` reveals the
  upper portion (head + shoulders) without horizontal cropping skew. If
  during implementation `object-top` is too tight or too loose, use
  `object-[center_top]` / `object-[center_25%]` to fine-tune.

## Accessibility

- Provide meaningful `alt` text on both the thumbnail and the modal image.
- Thumbnail trigger must be reachable by keyboard:
  - Use a `<button type="button">` wrapper rather than a bare `<div>` so
    Enter/Space activate it natively, OR add `role="button"`, `tabIndex={0}`,
    and an `onKeyDown` Enter/Space handler.
- `ModalDisplayPicture` already supports Escape-to-close and backdrop
  click; no changes there.
- Focus management: not strictly required by the requirement, but note
  for the implementer that returning focus to the trigger after the modal
  closes is a nice-to-have, not in scope for V01.

## Verification

1. `cd web && npm run lint` to confirm no new ESLint warnings around the
   added `useState` import, accessibility, or `next/image` usage.
2. `cd web && npm run build` to confirm the production build succeeds
   (note `next.config.mjs` has `ignoreBuildErrors: true`, so lint is the
   stronger TS signal).
3. `cd web && npm run dev` and manually verify in a browser:
   - Resume section renders the headshot to the left of the name on
     desktop widths.
   - The visible thumbnail shows head and shoulders only (no full-body
     crop, no awkward face cut-off).
   - On narrow widths the layout stacks without overlap or overflow.
   - Clicking the thumbnail opens the modal at ~90% viewport in both
     dimensions and shows the full uncropped image.
   - Escape and backdrop click both close the modal; body scroll is
     restored after close.
   - Keyboard: Tab to the thumbnail, press Enter / Space to open the
     modal; Escape closes.
   - Hero portrait modal still works (regression check — both sections
     use `ModalDisplayPicture` independently).
4. Confirm `web/public/headshotNRodriguez.jpg` is committed (static
   assets in `web/public/` are served at `/headshotNRodriguez.jpg`).

## Out of scope

- No API or backend changes. The resume PDF download (served via
  `/downloads/resumeNRodriguez.pdf` per
  `docs/20260528_RESUME_DOWNLOAD_VIA_API_PLAN_V02.md`) is untouched.
- No new shared component; reuse `ModalDisplayPicture` as-is.
- No automated tests added (the project currently has no frontend test
  harness configured for component-level tests).
- No image-optimization pipeline change (`unoptimized: true` stays).

## Open questions for the operator

1. **Filename of the public asset.** Proposed:
   `web/public/headshotNRodriguez.jpg`. Acceptable, or prefer a different
   name (e.g. `nick-headshot.jpg`)?
2. **Thumbnail size on desktop.** Proposed ~160px square. Larger
   (e.g. 192px) or smaller (128px) is trivial to adjust.
3. **Crop framing.** Proposed `object-cover object-top` on a 1:1 box. If
   the source image's subject is not centered horizontally at the top
   third, this may need a fine-tune during implementation.
