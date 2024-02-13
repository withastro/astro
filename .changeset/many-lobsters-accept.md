---
"astro": minor
---

Fixes an issue with view transition names containing spaces or punctuation.

This fix could be a breaking change if you leverage details about how Astro translates `transition:name` directives into values of the underlying CSS `view-transition-name` property.
This mainly affects spaces and punctuation marks but no unicode characters with codes >= 128.
