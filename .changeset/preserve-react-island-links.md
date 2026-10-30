---
'@astrojs/react': patch
---

Preserves component-rendered `<link>` tags (such as stylesheets and preconnect hints) in island output while only stripping auto-injected React 19 preloads.
