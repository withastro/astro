---
'astro': patch
---

Forward `--force` to the background dev server so it clears the content layer cache

When `astro dev` runs in the background (via `--background` or automatically when an agent is detected), the `--force` flag was not passed to the background child process. As a result, `astro dev --force --background` did not clear the content layer cache (`.astro/data-store.json`). `buildBackgroundArgs` now forwards `--force`, matching the behavior of the foreground command.