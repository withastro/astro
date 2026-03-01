---
'astro': patch
---

Reverts the support of Shiki with CSP. Unfortunately, after exhaustive tests, the highlighter can't be supported to cover all cases.  

Adds a warning when both Content Security Policy (CSP) and Shiki syntax highlighting are enabled, as they are incompatible due to Shiki's use of inline styles
