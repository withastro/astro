---
'@astrojs/react-renderer': patch
---

Fixes boolean attributes such as `open`, `disabled` and `checked` going missing from children with `experimentalReactChildren`, and text fields and checkboxes in island children ignoring input after hydration
