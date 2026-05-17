---
'astro': patch
---

Fix the issue where renaming an image file while the dev server is running triggers an build error.
With this fix, the dev server will now correctly hot-reload without crashing, even when files are automatically renamed by editors like VS Code.
