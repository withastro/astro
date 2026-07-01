---
'astro': patch
---

Fixes an issue where the ClientRouter wipes head elements after page transitions if the `<head>` contains a `server:defer` component.
