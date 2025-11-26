---
'astro': major
---

**Vite Environments API breaking changes:** Integration hooks and dev server interactions now use Vite's new Environments API.

**Changes:**
- Dev server HMR changed from `server.hot.send()` to `server.environments.client.hot.send()`
- Integration `astro:routes:resolved` hook now receives vite environments instead of raw vite server
- Dev toolbar and integration code accessing HMR must use the new Vite Environments API
