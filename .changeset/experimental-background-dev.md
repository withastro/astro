---
'astro': minor
---

Adds experimental background dev server management for AI coding agents

Adds `--experimental-background`, `--experimental-stop`, `--experimental-status`, and `--experimental-logs` flags to `astro dev`. Also adds a `/_astro/status` health endpoint and a dev server lock file (`.astro/dev.json`) to prevent duplicate servers. When an AI coding agent is detected via `am-i-vibing`, background mode is enabled automatically.
