---
"astro": minor
---

Fixes a regression where view transition names containing special characters such as spaces or punctuation stopped working.

Regular use naming your transitions with `transition: name` is unaffected.

However, this fix may result in breaking changes if your project relies on the particular character encoding strategy Astro uses to translate `transition:name` directives into values of the underlying CSS `view-transition-name` property. For example, `Welcome to Astro` is now encoded as `Welcome_20to_20Astro_2e`.

This mainly affects spaces and punctuation marks but no Unicode characters with codes >= 128.
