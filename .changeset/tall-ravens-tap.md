---
"@astrojs/vercel": patch
---

Fix forwarded serverless requests with streamed bodies by preserving the required `duplex: 'half'` option when rewriting middleware paths.
