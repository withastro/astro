---
'create-astro': patch
---

Removes the automatic `allowScripts` and `allowBuilds` pre-approval from generated projects. Astro's dependencies no longer run install scripts, so the workaround is no longer needed.
