---
'@astrojs/rss': minor
---

Added `trailingSlash` option to control whether or not the emitted URLs should have trailing slashes.

```js
import rss from '@astrojs/rss';

export const get = () => rss({
  trailingSlash: false
});
```

By passing `false`, the emitted links won't have trailing slashes.
