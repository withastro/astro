---
'astro': patch
---

Properly escapes script tags with nested client:load directives when passing Astro components into framework components via props. Browsers interpret script end tags in strings as script end tags, resulting in syntax errors.
