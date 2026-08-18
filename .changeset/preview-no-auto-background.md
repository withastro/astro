---
'astro': patch
---

Fixes `astro preview` starting a background daemon when an AI coding agent is detected. The foreground process exited immediately, breaking anything supervising it such as Playwright's `webServer`. Backgrounding is now only enabled by `--background`, as documented. `astro dev` is unchanged.
