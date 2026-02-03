---
'astro': minor
---

Adds a new `emitClientAsset` function to `astro/assets/utils` for integration authors. This function allows emitting assets that will be moved to the client directory during SSR builds, useful for assets referenced in server-rendered content that need to be available on the client.

```ts
import { emitClientAsset } from 'astro/assets/utils';

// Inside a Vite plugin's transform or load hook
const handle = emitClientAsset(this, {
  type: 'asset',
  name: 'my-image.png',
  source: imageBuffer,
});
```
