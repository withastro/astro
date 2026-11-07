---
'@astrojs/node': patch
---

Shares one process `unhandledRejection` listener across app handlers so standalone mode no longer treats in-request rejections as outside request context
