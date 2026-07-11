---
"astro": patch
---

Warns when a content collection `reference()` points to an entry that does not exist. Previously, invalid references (for example using an un-slugified id like `John-Doe` when the loader exposes `john-doe`) silently passed validation and only failed at render time.
