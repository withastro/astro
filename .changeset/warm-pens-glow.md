---
'astro': patch
---

Fixes form actions incorrectly auto-executing during error page rendering. When an error page (e.g. 404) is rendered, form actions from the original request are no longer executed, since the full request handling pipeline is not active.
