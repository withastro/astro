---
'@astrojs/rss': patch
---

Fixes `customData` rewriting numeric-looking text values, such as `<itunes:episode>007</itunes:episode>` being output as `<itunes:episode>7</itunes:episode>`
