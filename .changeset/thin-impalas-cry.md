---
"astro": patch
---

Fixes bug where server builds would include unneeded assets in SSR Function, potentially leading to upload errors on Vercel, Netlify because of size limits
