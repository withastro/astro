---
'astro': patch
---

Prevents a visible terminal window from popping up on Windows when the dev server runs in background mode. The detached child process is now spawned with `windowsHide: true`, so console-subsystem grandchildren (such as `workerd.exe`) no longer get a new focus-stealing window allocated by Windows Terminal.
