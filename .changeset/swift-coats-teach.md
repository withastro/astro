---
"astro": patch
---

The devtool bar doesn't report `div` and `span` when check their role. `div` and `span` are special elements that don't have an interaction assigned, instead it is assigned based on the role assigned via attributes.
