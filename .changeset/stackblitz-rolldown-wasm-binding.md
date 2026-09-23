---
'astro': patch
---

Fixes Astro 7 projects on StackBlitz and other WebContainer environments, where `astro dev`, `astro build`, and `astro info` exited silently after printing only a `WASI is an experimental feature` warning.

The failure came from a bug in rolldown 1.2.9's WebAssembly fallback, which was fixed in rolldown 1.2.10. Astro now requires `rolldown@^1.2.10` so package managers always install the fixed version.
