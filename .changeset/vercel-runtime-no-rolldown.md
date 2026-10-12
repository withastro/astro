---
'@astrojs/vercel': patch
---

Fixes on-demand routes failing with "Cannot find native binding" on Vercel, caused by the serverless function loading `rolldown` at runtime
