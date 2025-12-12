---
'astro': minor
---

Adds new optional properties to `setAdapter()` for adapter entrypoint handling in the Adapter API

**Changes:**
- New optional properties:
  - `entryType?: 'self' | 'legacy-dynamic'` - determines if the adapter provides its own entrypoint (`'self'`) or if Astro constructs one (`'legacy-dynamic'`, default)

**Migration:** Adapter authors can optionally add these properties to support custom dev entrypoints. If not specified, adapters will use the legacy behavior.
