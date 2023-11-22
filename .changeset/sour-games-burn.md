---
"astro": patch
---

Refactors virtual modules exports. This should not break your project unless you import Astro's internal modules, including:

- `astro/middleware/namespace`
- `astro/transitions`
- `astro/transitions/router`
- `astro/transitions/events`
- `astro/transitions/types`
- `astro/prefetch`
- `astro/i18n`
