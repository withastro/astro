---
'@astrojs/react-renderer': patch
---

Fixes boolean attributes such as `disabled` and `checked` being dropped from children with `experimentalReactChildren`, and form fields in island children becoming read-only after hydration
