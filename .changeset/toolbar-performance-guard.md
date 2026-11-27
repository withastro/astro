---
'astro': patch
---

Fixes the dev toolbar throwing an error and failing to load when `performance.addEventListener` is unavailable, such as when Playwright's fake clock (`page.clock.install()`) is installed
