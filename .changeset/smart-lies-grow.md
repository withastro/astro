---
'astro': minor
---

Add an `errorOverlayTheme` option in the astro config that will allow to specify the theme of the error overlay.

```ts
import { defineConfig } from 'astro/config';

export default defineConfig({
    // defaults to system
    errorOverlayTheme: 'dark', // or 'light' or 'system'
});
```