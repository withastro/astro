---
'create-astro': patch
---

Fixes shell command injection via `--add` flag by validating integration names against npm package name pattern before passing to shell
