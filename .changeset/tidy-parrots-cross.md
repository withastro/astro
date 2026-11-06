---
'@astrojs/internal-helpers': patch
---

Fixes `hasFileExtension` returning `false` for a bare filename with no leading path segment (for example `about.html` or `rss.xml`). The check now anchors the extension match to the start of the string as well as after a slash, so a filename is recognized whether or not it is preceded by a directory segment.
