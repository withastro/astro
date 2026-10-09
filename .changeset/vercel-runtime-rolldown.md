---
'@astrojs/vercel': patch
---

Fixes on-demand routes crashing with "Cannot find native binding" because the serverless function loaded `rolldown` at runtime
