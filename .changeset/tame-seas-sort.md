---
'astro': patch
---

Prevent React hook call warnings when used with MDX

When React and MDX are used in the same project, if the MDX integration is added before React, previously you'd get a warning about hook calls.

This makes it so that the MDX integration's JSX renderer is last in order.
