---
'@astrojs/react': patch
---

Removes hardcoded `ssr.external: ['react-dom/server', 'react-dom/client']` config that causes issues with adapters that bundle all dependencies (e.g. Cloudflare). These externals should already be inferred by default by Vite when deploying to a server environment.
