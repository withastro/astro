---
'astro': minor
---

**setAdapter() additions:** New optional properties for adapter entrypoint handling.

**Changes:**
- New optional properties:
  - `devEntrypoint?: string | URL` - specifies custom dev server entrypoint
  - `entryType?: 'self' | 'legacy-dynamic'` - determines if the adapter provides its own entrypoint (`'self'`) or if Astro constructs one (`'legacy-dynamic'`, default)

**Migration:** Adapter authors can optionally add these properties to support custom dev entrypoints. If not specified, adapters will use the legacy behavior.
