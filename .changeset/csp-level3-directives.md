---
'astro': patch
---

Adds support for CSP Level 3 directives (`script-src-elem`, `script-src-attr`, `style-src-elem`, `style-src-attr`) in the `security.csp.directives` configuration. When these directives are specified, Astro will automatically mirror the generated script/style hashes into them, ensuring compatibility with granular CSP policies.
