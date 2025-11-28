---
'astro': major
---

**Vite Environments API breaking changes:** Integration hooks and dev server interactions now use Vite's new Environments API.

**Changes:**
- Dev server HMR changed from `server.hot.send()` to `server.environments.client.hot.send()`
- Dev toolbar and integration code accessing HMR must use the new Vite Environments API
