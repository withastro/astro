---
'@astrojs/markdoc': patch
---

Fixes a build failure when a Markdoc tag rendered with the `component()` utility has a name containing two or more hyphens (e.g. `my-cool-tag`). The generated import identifier only replaced the first hyphen, producing invalid JavaScript.
