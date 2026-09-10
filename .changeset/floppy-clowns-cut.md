---
'astro': patch
---

Fixes `astro preview --ignore-lock` (and `astro dev --ignore-lock`) being refused when run from an AI agent environment. The flag now starts the server in the foreground instead of erroring, since agent detection only inferred background mode and was never explicitly requested. An explicit `--background` combined with `--ignore-lock` still errors.