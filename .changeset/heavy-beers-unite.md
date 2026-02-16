---
'astro': minor
---

Adds NPM to built-in font providers

To start using it, access it on `fontProviders`:

```js
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
    experimental: {
        fonts: [
            {
                name: 'Roboto',
                provider: fontProviders.npm(),
                cssVariable: '--font-roboto',
            },
        ],
    },
});
```
