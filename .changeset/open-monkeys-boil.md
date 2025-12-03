---
'@astrojs/cloudflare': major
---

Development server now runs in workerd

`astro dev` now runs your Cloudflare application using Cloudflare's workerd runtime instead of Node.js. This means your development environment is now a near-exact replica of your production environment—the same JavaScript engine, the same APIs, the same behavior. You'll catch issues during development that would have only appeared in production, and features like Durable Objects, Workers Analytics Engine, and R2 bindings work exactly as they do on Cloudflare's platform.

To accommodate this major change to your development environment, this update includes breaking changes to `Astro.locals.runtime`, removing some of its properties.

**Breaking Changes:**

- `Astro.locals.runtime` no longer contains the `env` object. Instead, import it directly:
  ```js
  import { env } from 'cloudflare:workers';
  ```

- `Astro.locals.runtime` no longer contains the `cf` object. Instead, access it directly from the request:
  ```js
  Astro.request.cf
  ```

- `Astro.locals.runtime` no longer contains the `caches` object. Instead, use the global `caches` object directly:
  ```js
  caches.default.put(request, response)
  ```

- `Astro.locals.runtime` object is replaced with `Astro.locals.cfContext` which contains the Cloudflare `ExecutionContext`:
  ```js
  const cfContext = Astro.locals.cfContext;
  ```
