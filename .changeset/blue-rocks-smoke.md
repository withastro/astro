---
'astro': patch
'@astrojs/netlify': patch
'@astrojs/node': patch
---

Netlify Adapter

This change adds a Netlify adapter that uses Netlify Functions. You can use it like so:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
	adapter: netlify()
});
```
