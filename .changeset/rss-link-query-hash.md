---
'@astrojs/rss': patch
---

Fixes feed item `link`, `commentsUrl` and enclosure URLs with a query string or hash getting a trailing slash appended to the query or hash, such as `/post?utm_source=rss` becoming `/post?utm_source=rss/`
