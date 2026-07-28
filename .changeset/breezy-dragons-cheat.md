---
'@astrojs/markdoc': patch
---

Fixes custom `transform` functions being dropped when a tag or node also specifies a custom `render` component. User-written transforms are now always preserved; only Markdoc's built-in transforms are removed so the custom component wins.
