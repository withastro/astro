---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Removes `getFontData()` exported from `astro:assets` with `fontData` when using the experimental Fonts API

Accessing font data can be useful for advanced use cases, such as generating meta tags or Open Graph images. Before, we exposed a `getFontData()` helper function to retrieve the font data for a given `cssVariable`. That was however limiting for programmatic usages that need to access all font data.

The `getFontData()` helper function is removed and replaced by a new `fontData` object:

```diff
-import { getFontData } from "astro:assets";
-const data = getFontData("--font-roboto")

+import { fontData } from "astro:assets";
+const data = fontData["--font-roboto"]
```

We may reintroduce `getFontData()` later on for a more friendly DX, based on your feedback.
