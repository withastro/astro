---
'@astrojs/markdoc': patch
---

Fixes `transform` functions being incorrectly removed when using dashed tag names, renamed parameters, or non-optional chaining in Markdoc configs.

The previous check used fragile string matching on the transform function's source code to determine if it "respects render." This failed for bracket notation (`config.tags?.['side-note']?.render`), renamed parameters (`c.tags?.myTag?.render`), and non-optional chaining (`config.tags.myTag.render`).

The fix replaces the string-based check with a reference-equality check against Markdoc's built-in transforms. Only built-in Markdoc transforms (which don't respect `render`) are now removed — user-written and Astro's own transforms are always preserved.
