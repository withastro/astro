---
'@astrojs/react-renderer': patch
---

Fixes text in children going missing or causing hydration errors with `experimentalReactChildren`, such as a space between inline elements, a line break in `<pre>`, or top-level text in an island
