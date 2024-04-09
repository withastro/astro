---
"astro": patch
---

Fixes a false positive for the elements `div` and `span`. `div` and `span` are special elements that don't have an interaction assigned, instead it is assigned based on the role assigned via attributes.

This means that cases like the following are deemed correct by the a11y audits:

```html
<div role="tablist"></div>
<span role="button" onclick="" onkeydown=""></span>
```
