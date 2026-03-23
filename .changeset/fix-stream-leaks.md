---
"@astrojs/node": patch
"@astrojs/partytown": patch
---

Fixes file descriptor leaks from read streams that were not destroyed on client disconnect or read errors
