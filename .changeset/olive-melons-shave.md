---
'astro': minor
---

Adds a `logger` parameter to the `transform()` method of local image services

Custom image services now receive Astro's runtime logger as a fourth argument. Messages logged with it are routed through the destination configured in `logger` and respect your log level, instead of being written straight to the console:

```ts
import type { LocalImageService } from 'astro';

const service: LocalImageService = {
  // ...
  async transform(inputBuffer, transform, imageConfig, logger) {
    logger.warn(`Could not optimize "${transform.src}". Passing it through unchanged.`);
    return { data: inputBuffer, format: 'png' };
  },
};
```

Astro's built-in Sharp service now uses this logger for the warnings it emits when it encounters an unexpected or unsupported source format.
