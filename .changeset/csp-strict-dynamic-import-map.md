---
'astro': patch
---

Fixes bundled scripts and hydrated islands being blocked when `security.csp.scriptDirective.strictDynamic` is enabled. Astro now adds the hash of every bundled script to `script-src` and renders an import map with their `integrity` in the `<head>`.
