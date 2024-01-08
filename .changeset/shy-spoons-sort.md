---
"@astrojs/rss": patch
---

Fixes the RSS schema to make the `title` optional if the description is already provided. It also makes `pubDate` and `link` optional, as specified in the RSS specification.
