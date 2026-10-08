---
'@astrojs/language-server': patch
---

Speeds up `astro check` by skipping a 10 ms editor-cancellation wait that ran before checking each file
