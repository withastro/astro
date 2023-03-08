---
'@astrojs/rss': minor
---

Added `trailingSlash` option, to control whether the emitted URLs should have the trailing slash.


```js
import rss from '@astrojs/rss';

export const get = () => rss({
  trailingSlash: false
});
```

By passing `false`, the emitted links won't have the trailing slash.
