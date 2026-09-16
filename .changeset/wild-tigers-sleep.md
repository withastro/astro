---
'astro': patch
---

Runs `astro dev` and `astro preview` in the foreground when an AI agent is detected on Windows, allowing the agent to manage the process lifetime. Pass `--background` explicitly to request an Astro-managed background process. Agent-inferred backgrounding remains enabled on other platforms.
