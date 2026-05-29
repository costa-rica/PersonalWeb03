---
created_at: 2026-05-29
updated_at: 2026-05-29
created_by: claude (opus-4.7)
modified_by: claude (opus-4.7)
---

# Resume Headshot Plan V02

## Changes from V01

V01 specified a 1:1 thumbnail box with `object-cover object-top`. Codex's
assessment correctly flagged that the source image is also 1:1 (800x800),
so `object-cover` would produce no crop and the thumbnail would show the
full seated figure — violating the requirement.

V02 changes the crop strategy: **ship a second, pre-cropped
head-and-shoulders asset for the thumbnail**, and keep the full original
for the modal. This is the most reliable way to guarantee the required
visual, decouples the framing decision from CSS guesswork, and keeps the
modal experience faithful to the unmodified original. A single-asset CSS
fallback is documented as Option B for completeness.

Everything else in V01 (layout, accessibility, `ModalDisplayPicture`
reuse, responsive behavior, verification steps) still stands except as
overridden in the sections below.

## Goal

Add a clickable headshot to the top-left of the on-page resume in
`web/src/components/ResumeSection.tsx`, mirroring the PDF layout. The
on-page thumbnail shows only the head and shoulders. Clicking it opens
`ModalDisplayPicture` displaying the unmodified original image at 90vw x
90vh.

## Source asset

- Operator-supplied original: `/home/nick/.hermes/image_cache/img_52f85da30cd1.jpg`
  - JPEG, 800x800, baseline JFIF. Subject is seated; head and shoulders
    occupy roughly the upper portion of the frame (exact percentage to
    be confirmed visually by the implementer when producing the crop).

## Asset strategy (Option A — recommended)

Ship **two** static assets under `web/public/`:

1. `web/public/headshotNRodriguez.jpg`
   - Byte-for-byte copy of the operator-supplied original (800x800).
   - Used by the modal so the user sees the full, uncropped image.
2. `web/public/headshotNRodriguezCrop.jpg`
   - A head-and-shoulders crop derived from the original.
   - Target framing: top of head near the top of the frame with a small
     margin, shoulders fully visible across the bottom edge, subject
     centered horizontally. Aspect ratio **1:1**, recommended output
     **400x400** (downscaled from the source crop region).
   - Used by the thumbnail. Because this asset is already cropped, the
     thumbnail can render it in a simple 1:1 box without relying on
     `object-cover` for cropping.

The implementer produces the crop with any image tool (e.g. ImageMagick:
`magick img_52f85da30cd1.jpg -gravity north -crop 800x400+0+40 +repage \
  -resize 400x400^ -gravity center -extent 400x400 headshotNRodriguezCrop.jpg`).
The exact offsets are not load-bearing — the requirement is "head and
shoulders only", verified visually. The implementer should adjust the
crop region until the framing matches a standard professional headshot.

Both files are committed to the repo under `web/public/`.

## Asset strategy (Option B — single-asset fallback)

If the operator rejects shipping a second asset, use a single original
and crop via CSS using an **overflow-clipping wrapper with an explicitly
oversized image** (not `object-cover`, which cannot crop a 1:1 image
inside a 1:1 box):

```tsx
<button
  type="button"
  onClick={() => setIsHeadshotModalOpen(true)}
  className="relative w-40 h-40 overflow-hidden rounded-lg border-2 border-black cursor-pointer transition-opacity hover:opacity-95"
  aria-label="Open headshot"
>
  <Image
    src="/headshotNRodriguez.jpg"
    alt="Nick Rodriguez headshot"
    width={320}
    height={320}
    className="absolute left-1/2 top-0 -translate-x-1/2 max-w-none"
  />
</button>
```

How this works: the wrapper is 160x160 with `overflow-hidden`. The image
is rendered at 320x320 (2x the wrapper), so only the top-left quadrant
region of the rendered image — corresponding to the upper half of the
source — is visible. `top-0` pins the rendered image's top edge to the
wrapper's top, revealing head and shoulders. Tune the rendered
`width`/`height` (zoom level) and the `top-*` value to refine framing.

This approach is brittle relative to Option A because the framing
depends on the subject's exact position in the source. Use it only if
shipping a second asset is unacceptable.

## Layout, accessibility, responsive behavior, verification

Unchanged from V01 except:

- The thumbnail `src` is `/headshotNRodriguezCrop.jpg` (Option A) or the
  oversized-image-in-overflow-hidden-wrapper pattern above (Option B).
- The modal `src` is **always** `/headshotNRodriguez.jpg` (the full,
  uncropped original).
- Under Option A the thumbnail `<Image>` can use plain
  `className="object-cover rounded-lg border-2 border-black"` on a
  1:1 box, because the asset is already a head-and-shoulders crop.
- Verification step 3 ("manually verify in a browser") gains an explicit
  check: confirm the thumbnail framing matches a head-and-shoulders shot
  (no torso, no full body) and the modal displays the original full
  image unchanged.

## Out of scope

Same as V01. Producing the cropped asset is part of implementation, not
a separate build pipeline — it is a one-time manual crop committed
alongside the code.

## Open questions for the operator

1. **Option A vs. Option B.** Option A (two assets) is recommended.
   Confirm acceptable, or direct the implementer to use Option B
   (single asset + CSS zoom-and-clip).
2. **Filenames.** Proposed `headshotNRodriguez.jpg` (full) and
   `headshotNRodriguezCrop.jpg` (thumbnail). Acceptable?
3. **Thumbnail size on desktop.** Proposed ~160px square; trivial to
   adjust to 128px or 192px.
