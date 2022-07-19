---
'astro': minor
'@astrojs/cloudflare': minor
'@astrojs/deno': minor
'@astrojs/netlify': minor
'@astrojs/vercel': minor
'@astrojs/node': minor
---

Adds support for Astro.clientAddress

The new `Astro.clientAddress` property allows you to get the IP address of the requested user.

```astro
<div>Your address { Astro.clientAddress }</div>
```

This property is only available when building for SSR, and only if the adapter you are using supports providing the IP address. If you attempt to access the property in a SSG app it will throw an error.
