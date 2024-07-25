---
'astro': patch
---

Fixes a case where the build was failing when `experimental.actions` was enabled, an adapter was in use, and there were not actions inside the user code base.
