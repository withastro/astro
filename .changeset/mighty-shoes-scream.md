---
'astro': minor
'@astrojs/cloudflare': patch
'@astrojs/netlify': patch
'@astrojs/vercel': patch
'@astrojs/image': patch
'@astrojs/deno': patch
'@astrojs/node': patch
---

Enable experimental support for hybrid SSR with pre-rendering enabled by default

__astro.config.mjs__
 ```js
import { defineConfig } from 'astro/config';
export defaultdefineConfig({
    output: 'hybrid',
        experimental: {
        hybridOutput: true,
    },
})
 ```
Then add `export const prerender =  false` to any page or endpoint you want to opt-out of pre-rendering.

__src/pages/contact.astro__
```astro
---
export const prerender = false

if (Astro.request.method === 'POST') {
    // handle form submission
}
---
<form method="POST">
    <input type="text" name="name" />
    <input type="email" name="email" />
    <button type="submit">Submit</button>
</form>
```
