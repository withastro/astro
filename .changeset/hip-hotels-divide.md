---
"astro": minor
---

Remove content collection warning when a configured collection does not have a matching directory name. This should resolve `i18n` collection warnings for Starlight users.

This also ensures configured collection names are always included in `getCollection()` and `getEntry()` types even when a matching directory is absent. We hope this allows users to discover typos during development by surfacing type information.
