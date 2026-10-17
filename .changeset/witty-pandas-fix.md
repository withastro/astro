---
'astro': patch
---

Fixes the `astro:env/server` virtual module being generated with invalid JS in dev when any environment variable contains `$` replacement patterns (`` $` ``, `$&`, `$'`, `$1`, …). The inlined env JSON was passed as a string to `String.replace`, so e.g. the `KITTY_PUBLIC_KEY` value set by default in Kitty terminals corrupted the module and broke dev with `Failed to parse source for import analysis`
