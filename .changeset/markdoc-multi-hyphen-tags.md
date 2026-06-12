---
'@astrojs/markdoc': patch
---

Fix Markdoc tag names containing two or more hyphens (e.g. `lead-capture-inline`) breaking the build with a confusing Rollup parse error. `toImportName` now replaces every hyphen with an underscore instead of only the first one, so the generated import statements use a valid JS identifier.
