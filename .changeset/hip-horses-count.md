---
"@astrojs/db": patch
---

Fix Astro DB seed failing when project path contains spaces. This resolves by properly decoding URL pathnames that contain encoded spaces (%20) before passing them to Vite's ssrLoadModule.
