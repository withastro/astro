---
"@astrojs/telemetry": patch
---

Track if the Astro CLI is running in a [`TTY`](nodejs.org/api/process.html#a-note-on-process-io) context. 

This information helps us better understand scripted use of Astro vs. direct terminal use of Astro CLI by a user, especially the `astro dev` command.
