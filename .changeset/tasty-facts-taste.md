---
'astro': patch
---

Fixes the dev server crashing when circular symlinks are present in the project directory (common in Nix environments). The file watcher now handles `ELOOP` and permission errors gracefully, logging a warning instead of crashing.
