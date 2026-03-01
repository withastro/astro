---
'@astrojs/markdoc': patch
---

Fixes an issue where spreading a built-in Markdoc node config (e.g., `...Markdoc.nodes.fence`) and specifying a custom `render` component would not work because the built-in `transform()` function was overriding the custom component. Now, `render` wins over `transform` when both are specified.
