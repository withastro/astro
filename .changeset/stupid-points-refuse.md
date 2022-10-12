---
'astro': minor
'@astrojs/cloudflare': minor
'@astrojs/deno': minor
'@astrojs/image': minor
'@astrojs/netlify': minor
'@astrojs/node': minor
'@astrojs/vercel': minor
---

# New build configuration

The ability to customize SSR build configuration more granularly is now available in Astro. You can now customize the output folder for `server` (the server code for SSR), `client` (your client-side JavaScript and assets), and `serverEntry` (the name of the entrypoint server module). Here are the defaults:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  build: {
    server: './dist/server/',
    client: './dist/client/',
    serverEntry: 'entry.mjs',
  }
});
```

These new configuration options are only supported in SSR mode and are ignored when building to SSG (a static site).

## Integration hook change

The integration hook `astro:build:start` includes a param `buildConfig` which includes all of these same options. You can continue to use this param in Astro 1.x, but it is deprecated in favor of the new `build.config` options. All of the built-in adapters have been updated to the new format. If you have an integration that depends on this param we suggest upgrading to do this instead:

```js
export default function myIntegration() {
  return {
    name: 'my-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          build: {
            server: '...'
          }
        });
      }
    }
  }
}
```
