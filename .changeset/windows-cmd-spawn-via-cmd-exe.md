---
'create-astro': patch
---

Fixes dependency installation failing on Windows when running `npm create astro@latest`. The previous fix for DEP0190 warnings incorrectly assumed `.cmd` shims could be spawned directly without a shell — on Windows, `.cmd` files require `cmd.exe` to execute. Package manager commands are now invoked via `cmd.exe /d /s /c` on Windows. Also fixes the `[object Object]` error message that appeared when installation failed, replacing it with the actual error.
