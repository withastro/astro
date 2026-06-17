---
'astro': patch
---

Fixes an issue where `server:defer` components in `<head>` would cause the ClientRouter to wipe all other head elements (stylesheets, meta tags, title) after page transitions. The server island replacer script now checks for the existence of its comment boundary marker before removing siblings, and the head swap logic now transfers comment nodes alongside elements.
