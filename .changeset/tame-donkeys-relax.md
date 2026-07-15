---
'astro': minor
---

Adds a `--ignore-lock` flag to `astro dev` for starting a dev server without checking or writing the lock file, so it can run alongside an already-running dev server for the same project.

The new instance is not tracked by `astro dev stop`, `astro dev status`, or `astro dev logs`. `--ignore-lock` cannot be combined with `--background` (or an auto-detected AI agent environment, which runs dev servers in the background automatically) or `--force`, since those rely on the lock file.

```shell
astro dev --ignore-lock
```
