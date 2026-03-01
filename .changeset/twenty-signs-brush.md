---
'@astrojs/cloudflare': minor
---

Adds support for more `@cloudflare/vite-plugin` options

The adapter now accepts the following [options from Cloudflare's Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/reference/api/):

- `auxiliaryWorkers`
- `configPath`
- `inspectorPort`
- `persistState`
- `remoteBindings`
- `experimental.headersAndRedirectsDevModeSupport`

For example, you can now set `inspectorPort` to provide a custom port for debugging your Workers:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
    adapter: cloudflare({
        inspectorPort: 3456
    })
})
```