---
'@astrojs/markdown-satteri': patch
---

Fixes `satteriHeadingIdsPlugin` sharing Slugger state across documents when reused as a user hast plugin, which caused headings with the same text in different posts to receive incorrect numeric suffixes