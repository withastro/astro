---
'@astrojs/rss': major
---

Update the `rss()` default export to return a `Response` instead of a simple object, which is deprecated in Astro 3.0. If you were directly returning the `rss()` result from an endpoint before, this breaking change should not affect you.

You can also import `getRssString()` to get the RSS string directly and use it to return your own Response:

```ts
// src/pages/rss.xml.js
import { getRssString } from '@astrojs/rss';

export async function get(context) {
  const rssString = await getRssString({
    title: 'Buzz’s Blog',
    ...
  });

  return new Response(rssString, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
```
