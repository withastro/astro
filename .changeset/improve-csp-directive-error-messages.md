---
'astro': patch
---

Improves error messages when an invalid or managed directive (e.g. `script-src`, `style-src`) is used in `security.csp.directives`. The error now clearly explains which directive is problematic and, for Astro-managed directives, points to the correct config option (`security.csp.scriptDirective` or `security.csp.styleDirective`).
