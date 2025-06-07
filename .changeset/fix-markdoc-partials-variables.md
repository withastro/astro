---
'@astrojs/markdoc': patch
---

Fixes variable substitution in Markdoc partials. Variables like `{% $name %}` now render correctly and Markdown syntax within variable values is properly processed.