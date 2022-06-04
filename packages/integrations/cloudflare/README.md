# @astrojs/cloudflare

Server-side rendered (SSR) [Astro](https://astro.build/) app for [Cloudflare Pages](https://pages.cloudflare.com/)

## Adapter 🔌
Set the adapter in your configuration file

```js
/** astro.config.mjs */
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
	adapter: cloudflare()
})
```

## Deploy 🚀
Refer to Cloudflare's [Deploy an Astro site](https://developers.cloudflare.com/pages/framework-guides/astro/) documentation

## Bonus ✨

### withHeaders 👽

Set custom headers in your Astro component

```js
/** .astro file */
---
export function withHeaders(headers: Headers) {
	headers.set('X-Astro', ❤️);
}
---
```

`Watch the space` This isn't standard practice; things may change

## Issues 😿
- [_redirects](https://developers.cloudflare.com/pages/platform/redirects/) file isn't being read by Cloudflare Pages. 
Redirects need to be handled withing an Astro component like this:
```js
/** old-segment/[slug].astro file */
---
return Astro.redirect(`/blog/${Astro.params.slug}`);
---
```
