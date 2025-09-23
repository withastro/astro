---
'astro': major
---

Removes the deprecated `emitESMImage()` function

In Astro 5.6.2, the `emitESMImage()` function was deprecated in favor of `emitImageMetadata()`, which removes two deprecated arguments that were not meant to be exposed for public use: `_watchMode` and `experimentalSvgEnabled`.

Astro 6.0 removes `emitESMImage()` entirely. Update to `emitImageMetadata()` to keep your current behavior.

#### What should I do?

Replace all occurrences of the `emitESMImage()` with `emitImageMetadata()` and remove unused arguments:

```ts del={1,5} ins={2,6}
import { emitESMImage } from 'astro/assets/utils';
import { emitImageMetadata } from 'astro/assets/utils';

const imageId = '/images/photo.jpg';
const result = await emitESMImage(imageId, false, false);
const result = await emitImageMetadata(imageId);
```
