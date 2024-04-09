---
"astro": patch
---

Fixes a false positive for `div` and `span` elements when running the Dev Toolbar accessibility audits.

Those are special elements that don't have an interaction assigned by default. Instead, it is assigned through the `role` attribute. This means that cases like the following are now deemed correct:

```html
<div role="tablist"></div>
<span role="button" onclick="" onkeydown=""></span>
```
