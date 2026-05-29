---
created_at: 2026-05-29
updated_at: 2026-05-29
created_by: codex (gpt-5)
modified_by: codex (gpt-5)
---

# Resume Headshot TODO V01 Assessment

## Moderate concern

### Phase 2 import instructions are inaccurate and incomplete

The TODO tells the implementer to "Add `useState` to the existing React import" and to import `ModalDisplayPicture` from `@/components/ModalDisplayPicture`, "matching" `HeroSection.tsx`. In the current code, `web/src/components/ResumeSection.tsx` has no React import at all, and `HeroSection.tsx` imports `ModalDisplayPicture` relatively as `./ModalDisplayPicture`. The TODO also includes an `<Image />` thumbnail snippet and says to use `next/image`, but it never explicitly instructs the implementer to import `Image` from `next/image`.

This is likely to confuse an implementing agent or produce a build failure if followed literally. The TODO should explicitly direct the implementer to add:

```ts
import { useState } from "react";
import Image from "next/image";
import ModalDisplayPicture from "./ModalDisplayPicture";
```

or otherwise state that the alias import is intentional even though it differs from the nearby component pattern.
