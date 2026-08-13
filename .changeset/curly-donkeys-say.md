---
'@astrojs/vercel': patch
---

Fixes server islands not working with `output: "static"`. The adapter now creates a serverless function for `/_server-islands/*` when `server:defer` components are used in static builds.
