---
'@astrojs/markdoc': patch
---

Fixes custom `transform` functions being incorrectly dropped for tags and nodes whose names require bracket access (e.g. `side-note`). The check that detects whether a transform respects a custom `render` component now recognizes bracket notation, optional chaining and whitespace, not only dot notation.
