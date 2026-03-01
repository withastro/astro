---
'@astrojs/cloudflare': major
---

Removes the `cloudflareModules` adapter option

The `cloudflareModules` option has been removed because it is no longer necessary. Cloudflare natively supports importing `.sql`, `.wasm`, and other module types.

#### What should I do?

Remove the `cloudflareModules` option from your Cloudflare adapter configuration if you were using it:

```diff
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
-   cloudflareModules: true
  })
});
```
