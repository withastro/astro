---
'astro': minor
---

Adds a new variant `sync` for the `astro:config:setup` hook's `command` property. This value is set when calling the command `astro sync`.

If your integration previously relied on knowing how many variants existed for the `command` property, you must update your logic to account for this new option.
