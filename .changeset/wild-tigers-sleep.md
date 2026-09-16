---
'astro': patch
---

Fixes `astro dev` and `astro preview` auto-backgrounding in AI agent environments on Windows. Agent task runners place the process tree in a Windows Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, so the background server spawned with `detached: true` was terminated the moment the runner closed the job. The background server is now spawned through WMI (`Win32_Process.Create`), which creates it outside the caller's Job Object, so it survives the parent CLI exiting.