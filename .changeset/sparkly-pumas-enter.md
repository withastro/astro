---
'astro': patch
---

Fixes the `glob()` loader watcher so negation patterns like `!docs/drafts/**` correctly exclude files during development, matching the behavior of the initial scan. Previously, negations were treated as independent matchers, causing unrelated files (including `.astro/data-store.json`) to be ingested as collection entries
