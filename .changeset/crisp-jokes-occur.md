---
'@astrojs/markdoc': patch
---

Fixes custom `transform` functions being incorrectly dropped for tags and nodes whose names require bracket access (e.g. `side-note`)
