---
'astro': patch
---

Fixes `--ignore-lock` being rejected when an AI agent environment is auto-detected for `astro dev` and `astro preview`. The flag now overrides agent-inferred background mode and starts a foreground server, allowing Playwright's `webServer` to work from agent sessions.
