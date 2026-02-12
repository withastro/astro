---
'create-astro': patch
'astro': patch
---

Fixes an issue where the `add` command could accept any arbitrary value, leading the possible command injections. Now `add` and `--add` accepts 
values that are only acceptable npmjs.org names.
