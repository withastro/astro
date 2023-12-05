---
'@astrojs/rss': patch
---

This commit addresses a quality-of-life concern when setting up a RSS feed using collections. Specifically, it provides more context to the error message thrown when the object passed to the `items` property is missing any of the three required keys or if one of those keys is mistyped.
