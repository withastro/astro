---
"astro": minor
---

Fixes an issue with view transition names containing spaces or punctuation.

If you use both, the Astro directive `transition:name` and the CSS property `view-transition-name`, make sure they still match according to the new encoding scheme.

