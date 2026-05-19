---
'astro': patch
---

Fixes an issue where the `file()` content loader did not generate a valid JSON Schema for collections whose JSON or YAML data is a top-level array instead of an object.
